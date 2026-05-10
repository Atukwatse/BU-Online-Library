from flask import Flask
from sqlalchemy import inspect, text

from .blueprints.admin import admin_bp
from .blueprints.api import api_bp
from .blueprints.auth import auth_bp
from .blueprints.library import library_bp
from .blueprints.main import main_bp
from .config import Config
from .extensions import bcrypt, csrf, db, login_manager, migrate, oauth
from .seed import seed_data


def ensure_legacy_schema_updates():
    inspector = inspect(db.engine)

    if inspector.has_table("users"):
        columns = {column["name"] for column in inspector.get_columns("users")}
        if "username" not in columns:
            db.session.execute(text("ALTER TABLE users ADD COLUMN username VARCHAR(80)"))
        if "department" not in columns:
            db.session.execute(text("ALTER TABLE users ADD COLUMN department VARCHAR(80)"))
        db.session.commit()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    bcrypt.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    csrf.init_app(app)
    oauth.init_app(app)

    login_manager.login_view = "auth.login_page"
    login_manager.login_message_category = "warning"

    if app.config["GOOGLE_CLIENT_ID"] and app.config["GOOGLE_CLIENT_SECRET"]:
        oauth.register(
            name="google",
            client_id=app.config["GOOGLE_CLIENT_ID"],
            client_secret=app.config["GOOGLE_CLIENT_SECRET"],
            server_metadata_url=app.config["GOOGLE_DISCOVERY_URL"],
            client_kwargs={"scope": "openid email profile"},
        )

    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(library_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(api_bp)

    with app.app_context():
        db.create_all()
        ensure_legacy_schema_updates()
        seed_data()

    return app
