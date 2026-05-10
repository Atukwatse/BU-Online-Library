from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from ..extensions import db
from ..models import Announcement, Book, BorrowedBook, Download, LibraryResource, User

api_bp = Blueprint("api", __name__)


def _require_admin_api():
    if not current_user.is_authenticated or current_user.role != "admin":
        return jsonify({"error": "Admin access required."}), 403
    return None


def _unique_username_from_email(email, requested_username=None):
    base = (requested_username or email.split("@")[0]).strip().lower() or "user"
    username = base
    counter = 1
    while User.query.filter_by(username=username).first():
        username = f"{base}-{counter}"
        counter += 1
    return username


@api_bp.route("/borrow", methods=["POST"])
@login_required
def borrow_endpoint():
    payload = request.get_json(silent=True) or request.form
    raw_book_id = payload.get("book_id") if hasattr(payload, "get") else None
    try:
        book_id = int(raw_book_id)
    except (TypeError, ValueError):
        book_id = None
    if not book_id:
        return jsonify({"error": "book_id is required."}), 400

    book = db.session.get(Book, int(book_id))
    if not book:
        return jsonify({"error": "Book not found."}), 404

    existing = BorrowedBook.query.filter_by(user_id=current_user.id, book_id=book.id).first()
    if not existing:
        db.session.add(BorrowedBook(user_id=current_user.id, book_id=book.id))
        book.availability = "Borrowed"
        db.session.commit()

    return jsonify({"message": "Book borrowed successfully.", "book_id": book.id})


@api_bp.route("/download", methods=["POST"])
@login_required
def download_endpoint():
    payload = request.get_json(silent=True) or request.form
    raw_book_id = payload.get("book_id") if hasattr(payload, "get") else None
    try:
        book_id = int(raw_book_id)
    except (TypeError, ValueError):
        book_id = None
    if not book_id:
        return jsonify({"error": "book_id is required."}), 400

    book = db.session.get(Book, int(book_id))
    if not book:
        return jsonify({"error": "Book not found."}), 404

    db.session.add(Download(user_id=current_user.id, book_id=book.id))
    db.session.commit()
    return jsonify({"message": "Book download recorded successfully.", "book_id": book.id})


@api_bp.route("/announcements")
def announcements_endpoint():
    announcements = Announcement.query.order_by(Announcement.date_posted.desc()).all()
    return jsonify(
        [{"id": item.id, "title": item.title, "content": item.content, "date_posted": item.date_posted.isoformat()} for item in announcements]
    )


@api_bp.route("/api/auth/register", methods=["POST"])
def auth_register_alias():
    payload = request.get_json(silent=True) or request.form
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").lower().strip()
    password = payload.get("password") or ""
    if not name or not email or len(password) < 8:
        return jsonify({"error": "Valid name, email, and password are required."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email is already registered."}), 409

    user = User(
        name=name,
        email=email,
        username=_unique_username_from_email(email, payload.get("username")),
        department=(payload.get("department") or "Library Services").strip(),
        role=(payload.get("role") or "staff").strip().lower(),
    )
    if user.role not in {"admin", "staff"}:
        user.role = "staff"
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "Registration successful.", "user_id": user.id}), 201


@api_bp.route("/api/books", methods=["GET"])
def list_books():
    books = Book.query.order_by(Book.created_at.desc()).all()
    return jsonify(
        [
            {
                "id": book.id,
                "title": book.title,
                "author": book.author,
                "category": book.category,
                "description": book.description,
                "availability": book.availability,
            }
            for book in books
        ]
    )


@api_bp.route("/api/books", methods=["POST"])
@login_required
def create_book():
    admin_error = _require_admin_api()
    if admin_error:
        return admin_error

    payload = request.get_json(silent=True) or request.form
    title = (payload.get("title") or "").strip()
    author = (payload.get("author") or "").strip()
    category = (payload.get("category") or "").strip()
    description = (payload.get("description") or "").strip()
    if not title or not author or not category:
        return jsonify({"error": "Title, author, and category are required."}), 400

    book = Book(
        title=title,
        author=author,
        category=category,
        description=description or f"{title} added through the API.",
        availability=(payload.get("availability") or "Available").strip(),
    )
    db.session.add(book)
    db.session.commit()
    return jsonify({"message": "Book created successfully.", "id": book.id}), 201


@api_bp.route("/api/books/<int:book_id>", methods=["PUT", "PATCH"])
@login_required
def update_book(book_id):
    admin_error = _require_admin_api()
    if admin_error:
        return admin_error

    book = db.session.get(Book, book_id)
    if not book:
        return jsonify({"error": "Book not found."}), 404

    payload = request.get_json(silent=True) or request.form
    book.title = (payload.get("title") or book.title).strip()
    book.author = (payload.get("author") or book.author).strip()
    book.category = (payload.get("category") or book.category).strip()
    book.description = (payload.get("description") or book.description).strip()
    book.availability = (payload.get("availability") or book.availability).strip()
    db.session.commit()
    return jsonify({"message": "Book updated successfully."})


@api_bp.route("/api/books/<int:book_id>", methods=["DELETE"])
@login_required
def delete_book(book_id):
    admin_error = _require_admin_api()
    if admin_error:
        return admin_error

    book = db.session.get(Book, book_id)
    if not book:
        return jsonify({"error": "Book not found."}), 404

    db.session.delete(book)
    db.session.commit()
    return jsonify({"message": "Book deleted successfully."})


@api_bp.route("/api/resources", methods=["GET"])
def list_resources():
    resources = LibraryResource.query.order_by(LibraryResource.created_at.desc()).all()
    return jsonify(
        [
            {
                "id": resource.id,
                "title": resource.title,
                "type": resource.type,
                "status": resource.status,
                "link": resource.link,
                "notes": resource.notes,
            }
            for resource in resources
        ]
    )


@api_bp.route("/api/resources", methods=["POST"])
@login_required
def create_resource():
    admin_error = _require_admin_api()
    if admin_error:
        return admin_error

    payload = request.get_json(silent=True) or request.form
    title = (payload.get("title") or "").strip()
    resource_type = (payload.get("type") or "").strip()
    if not title or not resource_type:
        return jsonify({"error": "Title and type are required."}), 400

    resource = LibraryResource(
        title=title,
        type=resource_type,
        status=(payload.get("status") or "active").strip(),
        link=(payload.get("link") or "").strip(),
        notes=(payload.get("notes") or "").strip(),
    )
    db.session.add(resource)
    db.session.commit()
    return jsonify({"message": "Resource created successfully.", "id": resource.id}), 201


@api_bp.route("/api/resources/<int:resource_id>", methods=["PUT", "PATCH"])
@login_required
def update_resource(resource_id):
    admin_error = _require_admin_api()
    if admin_error:
        return admin_error

    resource = db.session.get(LibraryResource, resource_id)
    if not resource:
        return jsonify({"error": "Resource not found."}), 404

    payload = request.get_json(silent=True) or request.form
    resource.title = (payload.get("title") or resource.title).strip()
    resource.type = (payload.get("type") or resource.type).strip()
    resource.status = (payload.get("status") or resource.status).strip()
    resource.link = (payload.get("link") or resource.link or "").strip()
    resource.notes = (payload.get("notes") or resource.notes or "").strip()
    db.session.commit()
    return jsonify({"message": "Resource updated successfully."})


@api_bp.route("/api/resources/<int:resource_id>", methods=["DELETE"])
@login_required
def delete_resource(resource_id):
    admin_error = _require_admin_api()
    if admin_error:
        return admin_error

    resource = db.session.get(LibraryResource, resource_id)
    if not resource:
        return jsonify({"error": "Resource not found."}), 404

    db.session.delete(resource)
    db.session.commit()
    return jsonify({"message": "Resource deleted successfully."})
