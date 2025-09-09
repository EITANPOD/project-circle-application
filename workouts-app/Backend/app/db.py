import os
from typing import Generator
from sqlmodel import SQLModel, create_engine, Session


def get_database_url() -> str:
    # Check if individual DB environment variables are provided
    db_host = os.getenv("DB_HOST")
    db_port = os.getenv("DB_PORT")
    db_name = os.getenv("DB_NAME")
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    
    # If all required variables are present, construct PostgreSQL URL
    if all([db_host, db_port, db_name, db_user, db_password]):
        return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    
    # Fallback to DATABASE_URL if provided
    env_url = os.getenv("DATABASE_URL")
    if env_url:
        return env_url
    
    # Default to local sqlite for development
    data_dir = os.getenv("DATA_DIR", ".")
    os.makedirs(data_dir, exist_ok=True)
    return f"sqlite:///{os.path.join(data_dir, 'app.db')}"


DATABASE_URL = get_database_url()


# For sqlite, need check_same_thread=False for threaded servers
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


def init_db() -> None:
    from . import models  # ensure models are imported before create_all
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


