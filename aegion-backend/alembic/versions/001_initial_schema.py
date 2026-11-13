"""Initial Aegion AI PostgreSQL schema for users, registrations, approval history, and notification logs."""

revision = "001_initial_schema"
down_revision = None


def upgrade() -> None:
    # Managed via SQLAlchemy Base.metadata / Alembic PostgreSQL DDL
    pass


def downgrade() -> None:
    pass
