from flask import Blueprint, abort, jsonify, redirect, render_template, request, url_for
from flask_login import current_user, login_required
from sqlalchemy import or_

from ..extensions import db
from ..forms import SearchForm
from ..models import Article, Book, BorrowedBook, Download, Journal

library_bp = Blueprint("library", __name__)


@library_bp.route("/ebooks")
def ebooks():
    category = request.args.get("category", "")
    query = Book.query
    if category:
        query = query.filter_by(category=category)
    books = query.order_by(Book.title.asc()).all()
    categories = ["Science", "Literature", "History", "Others"]
    return render_template("ebooks.html", books=books, categories=categories, active_category=category)


@library_bp.route("/ebooks/<int:book_id>")
def book_detail(book_id):
    book = db.session.get(Book, book_id)
    if not book:
        abort(404)
    return render_template("book_detail.html", book=book)


@library_bp.route("/journals")
def journals():
    journal_list = Journal.query.order_by(Journal.title.asc()).all()
    if request.accept_mimetypes.best == "application/json" or request.args.get("format") == "json":
        return jsonify([{"id": journal.id, "title": journal.title, "description": journal.description} for journal in journal_list])
    return render_template("journals.html", journals=journal_list)


@library_bp.route("/journals/<int:journal_id>")
def journal_detail(journal_id):
    journal = db.session.get(Journal, journal_id)
    if not journal:
        abort(404)
    return render_template("journal_detail.html", journal=journal)


@library_bp.route("/articles/<int:article_id>")
def article_detail(article_id):
    article = db.session.get(Article, article_id)
    if not article:
        abort(404)
    return render_template("article_detail.html", article=article)


@library_bp.route("/catalog/search")
def search_page():
    form = SearchForm(request.args)
    query_text = (request.args.get("query") or "").strip()
    category = (request.args.get("category") or "").strip()

    results = Book.query
    if query_text:
        search_term = f"%{query_text}%"
        results = results.filter(
            or_(
                Book.title.ilike(search_term),
                Book.author.ilike(search_term),
                Book.category.ilike(search_term),
            )
        )
    if category:
        results = results.filter_by(category=category)

    results = results.order_by(Book.title.asc()).all()
    return render_template("search_results.html", form=form, results=results, query_text=query_text, category=category)


@library_bp.route("/borrow/<int:book_id>", methods=["POST"])
@login_required
def borrow_book(book_id):
    book = db.session.get(Book, book_id)
    if not book:
        abort(404)

    existing = BorrowedBook.query.filter_by(user_id=current_user.id, book_id=book.id).first()
    if not existing:
        db.session.add(BorrowedBook(user_id=current_user.id, book_id=book.id))
        book.availability = "Borrowed"
        db.session.commit()
    return redirect(url_for("main.dashboard"))


@library_bp.route("/download/<int:book_id>", methods=["POST"])
@login_required
def download_book(book_id):
    book = db.session.get(Book, book_id)
    if not book:
        abort(404)

    db.session.add(Download(user_id=current_user.id, book_id=book.id))
    db.session.commit()
    return redirect(url_for("main.dashboard"))


@library_bp.route("/books")
def books_api():
    books = Book.query.order_by(Book.created_at.desc()).all()
    return jsonify(
        [
            {
                "id": book.id,
                "title": book.title,
                "author": book.author,
                "category": book.category,
                "availability": book.availability,
            }
            for book in books
        ]
    )


@library_bp.route("/books/<int:book_id>")
def book_detail_api(book_id):
    book = db.session.get(Book, book_id)
    if not book:
        return jsonify({"error": "Book not found."}), 404
    return jsonify(
        {
            "id": book.id,
            "title": book.title,
            "author": book.author,
            "category": book.category,
            "description": book.description,
            "file_path": book.file_path,
            "availability": book.availability,
        }
    )


@library_bp.route("/search")
def search_api():
    query_text = (request.args.get("query") or "").strip()
    category = (request.args.get("category") or "").strip()
    query = Book.query
    if query_text:
        search_term = f"%{query_text}%"
        query = query.filter(
            or_(Book.title.ilike(search_term), Book.author.ilike(search_term), Book.category.ilike(search_term))
        )
    if category:
        query = query.filter_by(category=category)

    results = query.order_by(Book.title.asc()).all()
    return jsonify(
        [
            {"id": book.id, "title": book.title, "author": book.author, "availability": book.availability}
            for book in results
        ]
    )


@library_bp.route("/journals/list")
def journals_api():
    journals = Journal.query.order_by(Journal.title.asc()).all()
    return jsonify([{"id": journal.id, "title": journal.title, "description": journal.description} for journal in journals])


@library_bp.route("/articles")
def articles_api():
    articles = Article.query.order_by(Article.created_at.desc()).all()
    return jsonify(
        [
            {
                "id": article.id,
                "journal_id": article.journal_id,
                "title": article.title,
                "author": article.author,
                "summary": article.summary,
            }
            for article in articles
        ]
    )
