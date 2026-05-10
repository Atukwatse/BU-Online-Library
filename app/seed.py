from .extensions import db
from .models import Announcement, Article, Book, Journal, LibraryResource, User


def seed_data():
    admin = User.query.filter_by(email="admin@bugema.ac.ug").first()
    if not admin:
        admin = User(email="admin@bugema.ac.ug")
    admin.name = "Library Administrator"
    admin.username = "admin"
    admin.department = "Library Administration"
    admin.role = "admin"
    admin.set_password("Admin@123")

    staff = User.query.filter_by(email="staff@bugema.ac.ug").first()
    if not staff:
        staff = User(email="staff@bugema.ac.ug")
    staff.name = "Bugema Library Staff"
    staff.username = "staff"
    staff.department = "Library Services"
    staff.role = "staff"
    staff.set_password("Staff@123")

    books = [
        Book(
            title="Foundations of Applied Science",
            author="Dr. Miriam K.",
            category="Science",
            description="A practical introduction to scientific reasoning, laboratory methods, and academic study.",
            file_path="uploads/books/foundations-of-applied-science.pdf",
            cover_image="images/library.png",
            availability="Available",
            featured=True,
        ),
        Book(
            title="African Literature in Context",
            author="Prof. Daniel S.",
            category="Literature",
            description="A study of African literary voices, themes, and historical influence across generations.",
            file_path="uploads/books/african-literature-in-context.pdf",
            cover_image="images/research.png",
            availability="Available",
            featured=True,
        ),
        Book(
            title="A History of East Africa",
            author="Janet N.",
            category="History",
            description="Explores political, social, and cultural developments in East Africa through major historical periods.",
            file_path="uploads/books/a-history-of-east-africa.pdf",
            cover_image="images/library.png",
            availability="Available",
            featured=False,
        ),
        Book(
            title="Academic Success and Study Skills",
            author="Library Support Team",
            category="Others",
            description="Guidance on study habits, note taking, research planning, and academic productivity.",
            file_path="uploads/books/academic-success-and-study-skills.pdf",
            cover_image="images/research.png",
            availability="Available",
            featured=True,
        ),
    ]

    journal = Journal(
        title="Bugema Journal of Research and Innovation",
        description="Peer-reviewed journal highlighting interdisciplinary scholarship, innovation, and community impact.",
        cover_image="images/research.png",
    )

    article_one = Article(
        journal=journal,
        title="Digital Literacy and University Learning Outcomes",
        author="Sarah T.",
        summary="Examines the relationship between digital resource access and improved higher-education outcomes.",
        file_path="uploads/articles/digital-literacy-and-university-learning-outcomes.pdf",
    )
    article_two = Article(
        journal=journal,
        title="Library Access Patterns in Modern Campuses",
        author="Peter W.",
        summary="Analyzes borrowing behavior, reading trends, and service preferences within university communities.",
        file_path="uploads/articles/library-access-patterns-in-modern-campuses.pdf",
    )

    announcements = [
        Announcement(
            title="Extended E-Library Access Hours",
            content="Students can now access selected digital resources until 10:00 PM on weekdays.",
        ),
        Announcement(
            title="New Research Journal Upload",
            content="The latest issue of the Bugema Journal of Research and Innovation is now available online.",
        ),
    ]

    resources = [
        LibraryResource(
            title="Bugema Digital Repository",
            type="database",
            status="active",
            link="https://repository.bugema.ac.ug",
            notes="Institutional repository for academic materials.",
        ),
        LibraryResource(
            title="Open Research Journal Access",
            type="journal",
            status="active",
            link="https://journals.example.org",
            notes="Curated access to partner journals.",
        ),
    ]

    if not Book.query.first():
        db.session.add_all(books)
    if not Journal.query.first():
        db.session.add_all([journal, article_one, article_two])
    if not Announcement.query.first():
        db.session.add_all(announcements)
    if not LibraryResource.query.first():
        db.session.add_all(resources)

    db.session.add_all([admin, staff])
    db.session.commit()
