from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings


def build_connection_string() -> str:
    driver = settings.mssql_driver.replace(" ", "+")
    return (
        f"mssql+pyodbc://{settings.mssql_username}:{settings.mssql_password}"
        f"@{settings.mssql_host}:{settings.mssql_port}/{settings.mssql_database}"
        f"?driver={driver}"
    )


engine = create_engine(build_connection_string(), pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

