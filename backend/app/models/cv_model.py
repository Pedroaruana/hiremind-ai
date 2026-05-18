from sqlalchemy import Column, String, Text
from app.database.connection import Base


class CV(Base):
    __tablename__ = "cvs"

    id = Column(String, primary_key=True, index=True)
    file_path = Column(String)
    text = Column(Text)
    ai_analysis = Column(Text)
    user = Column(String)