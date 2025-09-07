import os
from typing import Generator
from sqlmodel import SQLModel, create_engine, Session


def get_database_url() -> str:
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


