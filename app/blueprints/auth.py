from flask import Blueprint, current_app, flash, jsonify, redirect, render_template, request, send_from_directory, session, url_for
from flask_login import current_user, login_user, logout_user
from sqlalchemy import or_

from ..extensions import db, oauth
from ..forms import LoginForm, RegistrationForm
from ..models import User

auth_bp = Blueprint("auth", __name__)


def _refresh_session_from_user():
    if current_user.is_authenticated:
        session["user_id"] = current_user.id
        session["role"] = current_user.role
        return True
    return False


@auth_bp.route("/account/register", methods=["GET", "POST"])
def register_page():
    if current_user.is_authenticated:
        return redirect(url_for("main.home"))

    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(
            name=form.name.data.strip(),
            email=form.email.data.lower().strip(),
            username=_generate_unique_username(form.email.data),
            role="staff",
        )
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash("Registration successful. You can now sign in.", "success")
        return redirect(url_for("auth.login_page"))
    return render_template("register.html", form=form)


@auth_bp.route("/account/login", methods=["GET", "POST"])
def login_page():
    if not session.get("role") and _refresh_session_from_user():
        return redirect(_dashboard_route_for_role(current_user.role) or url_for("main.home"))

    if session.get("role") == "admin":
        return redirect(url_for("auth.admin_dashboard"))

    form = LoginForm()
    if form.validate_on_submit():
        identifier = form.email.data.lower().strip()
        user = User.query.filter(or_(User.email == identifier, User.username == identifier)).first()
        if user and user.check_password(form.password.data):
            login_user(user)
            session["user_id"] = user.id
            session["role"] = user.role
            flash("Welcome back to Bugema University E-Library.", "success")
            return redirect(_dashboard_route_for_role(user.role))
        flash("Invalid email or password.", "danger")
    return render_template("login.html", form=form)


@auth_bp.route("/account/logout")
def logout_page():
    session.clear()
    if current_user.is_authenticated:
        logout_user()
    flash("You have been logged out successfully.", "info")
    return redirect(url_for("auth.login_page"))


@auth_bp.route("/register", methods=["POST"])
def register_api():
    payload = request.get_json(silent=True) or request.form
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").lower().strip()
    password = payload.get("password") or ""

    if not name or not email or len(password) < 8:
        return jsonify({"error": "Valid name, email, and password are required."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email is already registered."}), 409

    user = User(name=name, email=email, username=_generate_unique_username(email), role="staff")
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "Registration successful.", "user_id": user.id}), 201


@auth_bp.route("/login", methods=["POST"])
def login_api():
    payload = request.get_json(silent=True) or request.form
    email = (payload.get("email") or payload.get("username") or "").lower().strip()
    password = payload.get("password") or ""

    user = User.query.filter(or_(User.email == email, User.username == email)).first()
    if not user or not user.check_password(password):
        if request.is_json:
            return jsonify({"error": "Invalid credentials."}), 401
        flash("Invalid email/username or password.", "danger")
        return redirect(url_for("auth.login_page"))

    login_user(user)
    session["user_id"] = user.id
    session["role"] = user.role
    redirect_url = _dashboard_route_for_role(user.role)
    if not redirect_url:
        return jsonify({"error": "User role is not permitted."}), 403

    if request.is_json:
        return jsonify(
            {
                "message": "Login successful.",
                "redirect_url": redirect_url,
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "username": user.username,
                    "department": user.department,
                    "role": user.role,
                },
            }
        )

    return redirect(redirect_url)


@auth_bp.route("/logout", methods=["POST", "GET"])
def logout_api():
    session.clear()
    if current_user.is_authenticated:
        logout_user()
    if request.accept_mimetypes.best == "application/json" or request.is_json:
        return jsonify({"message": "Logged out successfully."})
    return redirect(url_for("auth.login_page"))


@auth_bp.route("/account/google")
def google_auth():
    google = oauth.create_client("google")
    if google is None:
        flash("Google OAuth is not configured yet. Add Google credentials to your .env file.", "warning")
        return redirect(url_for("auth.login_page"))

    redirect_uri = url_for("auth.google_callback", _external=True)
    return google.authorize_redirect(redirect_uri)


@auth_bp.route("/auth/google/callback")
def google_callback():
    google = oauth.create_client("google")
    if google is None:
        flash("Google OAuth is not configured.", "danger")
        return redirect(url_for("auth.login_page"))

    try:
        token = google.authorize_access_token()
        user_info = token.get("userinfo") or google.userinfo()
    except Exception:
        flash("Google authentication failed. Please try again.", "danger")
        return redirect(url_for("auth.login_page"))

    email = (user_info.get("email") or "").lower().strip()
    if not email or not user_info.get("email_verified"):
        flash("Your Google account email must be verified before you can sign in.", "danger")
        return redirect(url_for("auth.login_page"))

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(
            name=(user_info.get("name") or email.split("@")[0]).strip(),
            email=email,
            username=_generate_unique_username(email),
            department="Library Services",
            role="staff",
        )
        user.set_password(f"oauth-{user_info.get('sub', email)}")
        db.session.add(user)
        db.session.commit()

    login_user(user)
    session["user_id"] = user.id
    session["role"] = user.role
    return redirect(_dashboard_route_for_role(user.role) or url_for("auth.login_page"))


def _dashboard_route_for_role(role):
    if role == "admin":
        return url_for("auth.admin_dashboard")
    return None


def _generate_unique_username(identifier):
    base = identifier.split("@")[0].strip().lower().replace(" ", "-") or "user"
    username = base
    counter = 1
    while User.query.filter_by(username=username).first():
        username = f"{base}-{counter}"
        counter += 1
    return username


def _require_role(role):
    if not session.get("role"):
        _refresh_session_from_user()

    session_role = session.get("role")
    if session_role != role:
        flash("Please log in with an authorized account.", "warning")
        return redirect(url_for("auth.login_page"))
    return None


@auth_bp.route("/login", methods=["GET"])
def login_entry():
    return redirect(url_for("auth.login_page"))


@auth_bp.route("/admin-dashboard")
def admin_dashboard():
    unauthorized = _require_role("admin")
    if unauthorized:
        return unauthorized
    return send_from_directory(current_app.config["PROJECT_ROOT"], "admin-dashboard.html")


@auth_bp.route("/admin-dashboard.html")
def admin_dashboard_legacy():
    return redirect(url_for("auth.admin_dashboard"))
