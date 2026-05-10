from datetime import datetime

from flask_login import UserMixin

from .extensions import bcrypt, db, login_manager


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    username = db.Column(db.String(80), unique=True, index=True)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    department = db.Column(db.String(80))
    role = db.Column(db.String(20), nullable=False, default="staff")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    borrowed_books = db.relationship("BorrowedBook", back_populates="user", cascade="all, delete-orphan")
    downloads = db.relationship("Download", back_populates="user", cascade="all, delete-orphan")

    def set_password(self, raw_password):
        self.password = bcrypt.generate_password_hash(raw_password).decode("utf-8")

    def check_password(self, raw_password):
        return bcrypt.check_password_hash(self.password, raw_password)

    @property
    def is_admin(self):
        return self.role == "admin"

    @property
    def is_staff(self):
        return self.role == "staff"


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


class Book(db.Model):
    __tablename__ = "books"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    file_path = db.Column(db.String(255))
    cover_image = db.Column(db.String(255))
    availability = db.Column(db.String(30), nullable=False, default="Available")
    featured = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    borrows = db.relationship("BorrowedBook", back_populates="book", cascade="all, delete-orphan")
    downloads = db.relationship("Download", back_populates="book", cascade="all, delete-orphan")


class Journal(db.Model):
    __tablename__ = "journals"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    cover_image = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    articles = db.relationship("Article", back_populates="journal", cascade="all, delete-orphan")


class Article(db.Model):
    __tablename__ = "articles"

    id = db.Column(db.Integer, primary_key=True)
    journal_id = db.Column(db.Integer, db.ForeignKey("journals.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(150), nullable=False)
    summary = db.Column(db.Text, nullable=False)
    file_path = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    journal = db.relationship("Journal", back_populates="articles")


class BorrowedBook(db.Model):
    __tablename__ = "borrowed_books"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey("books.id"), nullable=False)
    date_borrowed = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship("User", back_populates="borrowed_books")
    book = db.relationship("Book", back_populates="borrows")


class Download(db.Model):
    __tablename__ = "downloads"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey("books.id"), nullable=False)
    date_downloaded = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship("User", back_populates="downloads")
    book = db.relationship("Book", back_populates="downloads")


class Announcement(db.Model):
    __tablename__ = "announcements"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    date_posted = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class ContactMessage(db.Model):
    __tablename__ = "contact_messages"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class LibraryResource(db.Model):
    __tablename__ = "library_resources"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50), nullable=False, default="active")
    link = db.Column(db.String(255))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
