from pathlib import Path

from flask import Blueprint, current_app, flash, jsonify, redirect, render_template, request, send_from_directory, session, url_for
from flask_login import current_user, login_required
from sqlalchemy import not_

from ..extensions import db
from ..forms import ContactForm, ProfileForm, SearchForm
from ..models import Announcement, Book, ContactMessage, Download, LibraryResource, User

main_bp = Blueprint("main", __name__)


def _session_user():
    user_id = session.get("user_id")
    if user_id:
        user = db.session.get(User, user_id)
        if user:
            session["role"] = user.role
            return user
        session.clear()

    if current_user.is_authenticated:
        session["user_id"] = current_user.id
        session["role"] = current_user.role
        return current_user

    return None


@main_bp.app_context_processor
def inject_search_form():
    return {"nav_search_form": SearchForm()}


@main_bp.route("/")
def home():
    featured_books = Book.query.filter_by(featured=True).limit(4).all()
    announcements = Announcement.query.order_by(Announcement.date_posted.desc()).limit(3).all()
    return render_template("home.html", featured_books=featured_books, announcements=announcements)


@main_bp.route("/<path:filename>")
def project_static(filename):
    allowed_suffixes = {".css", ".js", ".jpg", ".jpeg", ".png", ".webp", ".svg", ".ico", ".html"}
    path = Path(current_app.config["PROJECT_ROOT"]) / filename
    if path.suffix.lower() not in allowed_suffixes or not path.exists() or not path.is_file():
        return render_template("404.html"), 404
    return send_from_directory(current_app.config["PROJECT_ROOT"], filename)


@main_bp.route("/help", methods=["GET", "POST"])
@main_bp.route("/contact", methods=["GET", "POST"])
def contact():
    if request.method == "GET" and (request.accept_mimetypes.best == "application/json" or request.args.get("format") == "json"):
        messages = ContactMessage.query.order_by(ContactMessage.created_at.desc()).all()
        return jsonify(
            [{"id": item.id, "name": item.name, "email": item.email, "message": item.message} for item in messages]
        )

    form = ContactForm()
    if form.validate_on_submit():
        message = ContactMessage(name=form.name.data.strip(), email=form.email.data.lower().strip(), message=form.message.data.strip())
        db.session.add(message)
        db.session.commit()
        flash("Your message has been sent to the library team.", "success")
        return redirect(url_for("main.contact"))

    if request.method == "POST" and request.is_json:
        payload = request.get_json(silent=True) or {}
        name = (payload.get("name") or "").strip()
        email = (payload.get("email") or "").lower().strip()
        message_text = (payload.get("message") or "").strip()
        if not name or not email or len(message_text) < 10:
            return jsonify({"error": "Valid name, email, and message are required."}), 400
        message = ContactMessage(name=name, email=email, message=message_text)
        db.session.add(message)
        db.session.commit()
        return jsonify({"message": "Contact message submitted successfully."}), 201

    return render_template("contact.html", form=form)


@main_bp.route("/account/dashboard")
@login_required
def dashboard():
    borrowed_books = current_user.borrowed_books
    borrowed_ids = [borrow.book_id for borrow in borrowed_books]
    recommendations = (
        Book.query.filter(not_(Book.id.in_(borrowed_ids))) if borrowed_ids else Book.query
    ).limit(4).all()
    download_history = Download.query.filter_by(user_id=current_user.id).order_by(Download.date_downloaded.desc()).all()
    return render_template(
        "dashboard.html",
        borrowed_books=borrowed_books,
        download_history=download_history,
        recommendations=recommendations,
    )


@main_bp.route("/account/profile", methods=["GET", "POST"])
@login_required
def profile():
    form = ProfileForm(obj=current_user)
    if form.validate_on_submit():
        existing_user = User.query.filter(User.email == form.email.data.lower().strip(), User.id != current_user.id).first()
        if existing_user:
            flash("That email address is already in use.", "danger")
            return render_template("profile.html", form=form)
        current_user.name = form.name.data.strip()
        current_user.email = form.email.data.lower().strip()
        db.session.commit()
        flash("Your profile has been updated.", "success")
        return redirect(url_for("main.profile"))
    return render_template("profile.html", form=form)


@main_bp.app_errorhandler(404)
def not_found(_error):
    return render_template("404.html"), 404


@main_bp.app_errorhandler(500)
def internal_error(_error):
    db.session.rollback()
    return render_template("500.html"), 500


@main_bp.route("/api/session/me")
def session_me():
    user = _session_user()
    if not user:
        return jsonify({"error": "Authentication required."}), 401

    return jsonify(
        {
            "id": user.id,
            "name": user.name,
            "username": user.username,
            "email": user.email,
            "department": user.department,
            "role": user.role,
        }
    )


@main_bp.route("/api/admin/dashboard")
def admin_dashboard_data():
    user = _session_user()
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required."}), 403

    books = Book.query.order_by(Book.created_at.desc()).limit(20).all()
    resources = LibraryResource.query.order_by(LibraryResource.created_at.desc()).limit(20).all()
    staff_users = User.query.filter(User.role.in_(["admin", "staff"])).order_by(User.created_at.desc()).all()

    return jsonify(
        {
            "stats": {
                "books": Book.query.count(),
                "resources": LibraryResource.query.count(),
                "staff": User.query.filter(User.role.in_(["admin", "staff"])).count(),
            },
            "books": [
                {
                    "id": book.id,
                    "title": book.title,
                    "author": book.author,
                    "category": book.category,
                    "quantity": 1,
                }
                for book in books
            ],
            "resources": [
                {
                    "id": resource.id,
                    "title": resource.title,
                    "type": resource.type,
                    "status": resource.status,
                    "link": resource.link,
                    "notes": resource.notes,
                }
                for resource in resources
            ],
            "staff": [
                {
                    "id": user.id,
                    "department": user.department or "Library",
                    "username": user.username or user.email.split("@")[0],
                    "role": user.role,
                }
                for user in staff_users
            ],
        }
    )


@main_bp.route("/api/admin/books", methods=["POST"])
def admin_add_book():
    user = _session_user()
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required."}), 403

    payload = request.get_json(silent=True) or request.form
    title = (payload.get("title") or "").strip()
    author = (payload.get("author") or "").strip()
    category = (payload.get("category") or "").strip()
    if not title or not author or not category:
        return jsonify({"error": "Title, author, and category are required."}), 400

    book = Book(
        title=title,
        author=author,
        category=category,
        description=(payload.get("notes") or f"{title} added through the admin dashboard.").strip(),
        availability="Available",
    )
    db.session.add(book)
    db.session.commit()
    return jsonify({"message": "Book saved successfully.", "id": book.id}), 201


@main_bp.route("/api/admin/resources", methods=["POST"])
def admin_add_resource():
    user = _session_user()
    if not user or user.role != "admin":
        return jsonify({"error": "Admin access required."}), 403

    payload = request.get_json(silent=True) or request.form
    title = (payload.get("title") or "").strip()
    resource_type = (payload.get("type") or "").strip()
    status = (payload.get("status") or "active").strip()
    if not title or not resource_type:
        return jsonify({"error": "Title and type are required."}), 400

    resource = LibraryResource(
        title=title,
        type=resource_type,
        status=status,
        link=(payload.get("link") or "").strip(),
        notes=(payload.get("notes") or "").strip(),
    )
    db.session.add(resource)
    db.session.commit()
    return jsonify({"message": "Resource saved successfully.", "id": resource.id}), 201
