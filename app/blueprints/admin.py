from functools import wraps

from flask import Blueprint, abort, flash, redirect, render_template, request, url_for
from flask_login import current_user, login_required

from ..extensions import db
from ..forms import AnnouncementForm, ArticleForm, BookForm, JournalForm
from ..models import Announcement, Article, Book, Journal, User

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


def admin_required(view_func):
    @wraps(view_func)
    @login_required
    def wrapped(*args, **kwargs):
        if not current_user.is_admin:
            abort(403)
        return view_func(*args, **kwargs)

    return wrapped


@admin_bp.route("/")
@admin_required
def dashboard():
    return render_template(
        "admin/dashboard.html",
        book_count=Book.query.count(),
        journal_count=Journal.query.count(),
        user_count=User.query.count(),
        announcement_count=Announcement.query.count(),
        recent_books=Book.query.order_by(Book.created_at.desc()).limit(5).all(),
        recent_announcements=Announcement.query.order_by(Announcement.date_posted.desc()).limit(5).all(),
    )


@admin_bp.route("/books", methods=["GET", "POST"])
@admin_required
def books():
    edit_id = request.args.get("edit", type=int)
    book_to_edit = db.session.get(Book, edit_id) if edit_id else None
    form = BookForm(obj=book_to_edit)
    if form.validate_on_submit():
        book = book_to_edit or Book()
        book.title = form.title.data.strip()
        book.author = form.author.data.strip()
        book.category = form.category.data
        book.description = form.description.data.strip()
        book.file_path = form.file_path.data.strip()
        book.cover_image = form.cover_image.data.strip()
        book.availability = form.availability.data
        book.featured = form.featured.data == "yes"
        db.session.add(book)
        db.session.commit()
        flash("Book saved successfully.", "success")
        return redirect(url_for("admin.books"))
    return render_template(
        "admin/books.html",
        form=form,
        books=Book.query.order_by(Book.created_at.desc()).all(),
        book_to_edit=book_to_edit,
    )


@admin_bp.route("/books/<int:book_id>/delete", methods=["POST"])
@admin_required
def delete_book(book_id):
    book = db.session.get(Book, book_id)
    if book:
        db.session.delete(book)
        db.session.commit()
        flash("Book deleted successfully.", "info")
    return redirect(url_for("admin.books"))


@admin_bp.route("/journals/<int:journal_id>/delete", methods=["POST"])
@admin_required
def delete_journal(journal_id):
    journal = db.session.get(Journal, journal_id)
    if journal:
        db.session.delete(journal)
        db.session.commit()
        flash("Journal deleted successfully.", "info")
    return redirect(url_for("admin.journals"))


@admin_bp.route("/journals", methods=["GET", "POST"])
@admin_required
def journals():
    form = JournalForm()
    article_form = ArticleForm(prefix="article")
    if form.validate_on_submit():
        journal = Journal(
            title=form.title.data.strip(),
            description=form.description.data.strip(),
            cover_image=form.cover_image.data.strip(),
        )
        db.session.add(journal)
        db.session.commit()
        flash("Journal saved successfully.", "success")
        return redirect(url_for("admin.journals"))

    return render_template(
        "admin/journals.html",
        form=form,
        article_form=article_form,
        journals=Journal.query.order_by(Journal.created_at.desc()).all(),
    )


@admin_bp.route("/journals/<int:journal_id>/articles", methods=["POST"])
@admin_required
def add_article(journal_id):
    journal = db.session.get(Journal, journal_id)
    if not journal:
        abort(404)

    form = ArticleForm(prefix="article")
    if form.validate_on_submit():
        article = Article(
            journal_id=journal.id,
            title=form.title.data.strip(),
            author=form.author.data.strip(),
            summary=form.summary.data.strip(),
            file_path=form.file_path.data.strip(),
        )
        db.session.add(article)
        db.session.commit()
        flash("Article added successfully.", "success")
    else:
        flash("Please complete the article form correctly.", "danger")
    return redirect(url_for("admin.journals"))


@admin_bp.route("/articles/<int:article_id>/delete", methods=["POST"])
@admin_required
def delete_article(article_id):
    article = db.session.get(Article, article_id)
    if article:
        db.session.delete(article)
        db.session.commit()
        flash("Article deleted successfully.", "info")
    return redirect(url_for("admin.journals"))


@admin_bp.route("/announcements", methods=["GET", "POST"])
@admin_required
def announcements():
    form = AnnouncementForm()
    if form.validate_on_submit():
        announcement = Announcement(title=form.title.data.strip(), content=form.content.data.strip())
        db.session.add(announcement)
        db.session.commit()
        flash("Announcement posted successfully.", "success")
        return redirect(url_for("admin.announcements"))
    return render_template(
        "admin/announcements.html",
        form=form,
        announcements=Announcement.query.order_by(Announcement.date_posted.desc()).all(),
    )


@admin_bp.route("/announcements/<int:announcement_id>/delete", methods=["POST"])
@admin_required
def delete_announcement(announcement_id):
    announcement = db.session.get(Announcement, announcement_id)
    if announcement:
        db.session.delete(announcement)
        db.session.commit()
        flash("Announcement deleted successfully.", "info")
    return redirect(url_for("admin.announcements"))


@admin_bp.route("/users")
@admin_required
def users():
    return render_template("admin/users.html", users=User.query.order_by(User.created_at.desc()).all())


@admin_bp.route("/users/<int:user_id>/delete", methods=["POST"])
@admin_required
def delete_user(user_id):
    user = db.session.get(User, user_id)
    if user and user.id != current_user.id:
        db.session.delete(user)
        db.session.commit()
        flash("User deleted successfully.", "info")
    return redirect(url_for("admin.users"))
