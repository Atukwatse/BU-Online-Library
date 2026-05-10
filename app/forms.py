from flask_wtf import FlaskForm
from wtforms import EmailField, PasswordField, SelectField, StringField, SubmitField, TextAreaField
from wtforms.validators import Email, EqualTo, InputRequired, Length, ValidationError

from .models import User


class RegistrationForm(FlaskForm):
    name = StringField("Full name", validators=[InputRequired(), Length(max=150)])
    email = EmailField("Email", validators=[InputRequired(), Email(), Length(max=150)])
    password = PasswordField("Password", validators=[InputRequired(), Length(min=8, max=128)])
    confirm_password = PasswordField(
        "Confirm password",
        validators=[InputRequired(), EqualTo("password", message="Passwords must match.")],
    )
    submit = SubmitField("Create account")

    def validate_email(self, field):
        if User.query.filter_by(email=field.data.lower()).first():
            raise ValidationError("That email is already registered.")


class LoginForm(FlaskForm):
    email = StringField("Email or username", validators=[InputRequired(), Length(max=150)])
    password = PasswordField("Password", validators=[InputRequired()])
    submit = SubmitField("Sign in")


class SearchForm(FlaskForm):
    query = StringField("Search", validators=[Length(max=200)])
    category = SelectField(
        "Category",
        choices=[
            ("", "All categories"),
            ("Science", "Science"),
            ("Literature", "Literature"),
            ("History", "History"),
            ("Others", "Others"),
        ],
    )
    submit = SubmitField("Search")


class ContactForm(FlaskForm):
    name = StringField("Name", validators=[InputRequired(), Length(max=150)])
    email = EmailField("Email", validators=[InputRequired(), Email(), Length(max=150)])
    message = TextAreaField("Message", validators=[InputRequired(), Length(min=10)])
    submit = SubmitField("Send message")


class BookForm(FlaskForm):
    title = StringField("Title", validators=[InputRequired(), Length(max=200)])
    author = StringField("Author", validators=[InputRequired(), Length(max=150)])
    category = SelectField(
        "Category",
        choices=[
            ("Science", "Science"),
            ("Literature", "Literature"),
            ("History", "History"),
            ("Others", "Others"),
        ],
    )
    description = TextAreaField("Description", validators=[InputRequired()])
    file_path = StringField("Book file path", validators=[Length(max=255)])
    cover_image = StringField("Cover image path", validators=[Length(max=255)])
    availability = SelectField(
        "Availability",
        choices=[("Available", "Available"), ("Borrowed", "Borrowed"), ("Restricted", "Restricted")],
    )
    featured = SelectField("Featured", choices=[("yes", "Yes"), ("no", "No")])
    submit = SubmitField("Save book")


class JournalForm(FlaskForm):
    title = StringField("Title", validators=[InputRequired(), Length(max=200)])
    description = TextAreaField("Description", validators=[InputRequired()])
    cover_image = StringField("Cover image path", validators=[Length(max=255)])
    submit = SubmitField("Save journal")


class ArticleForm(FlaskForm):
    title = StringField("Title", validators=[InputRequired(), Length(max=200)])
    author = StringField("Author", validators=[InputRequired(), Length(max=150)])
    summary = TextAreaField("Summary", validators=[InputRequired()])
    file_path = StringField("Article file path", validators=[Length(max=255)])
    submit = SubmitField("Save article")


class AnnouncementForm(FlaskForm):
    title = StringField("Title", validators=[InputRequired(), Length(max=200)])
    content = TextAreaField("Content", validators=[InputRequired()])
    submit = SubmitField("Post announcement")


class ProfileForm(FlaskForm):
    name = StringField("Full name", validators=[InputRequired(), Length(max=150)])
    email = EmailField("Email", validators=[InputRequired(), Email(), Length(max=150)])
    submit = SubmitField("Update profile")
