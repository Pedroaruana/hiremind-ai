from fastapi import APIRouter, UploadFile, File, Depends
import os
import uuid
import json
import pdfplumber

from app.services.auth_dependency import get_current_user
from app.database.connection import SessionLocal
from app.models.cv_model import CV

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def extract_text_from_pdf(path: str):
    try:
        with pdfplumber.open(path) as pdf:
            text = ""
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text
        return text or ""
    except Exception as e:
        return f"PDF_ERROR: {str(e)}"


def analyze_cv(text: str):
    text_lower = text.lower()

    skills_db = {
        "react": "Frontend",
        "node": "Backend",
        "javascript": "Full Stack",
        "python": "Backend",
        "java": "Backend",
        "sql": "Database",
        "html": "Frontend",
        "css": "Frontend"
    }

    found_skills = []
    areas = set()

    for skill, area in skills_db.items():
        if skill in text_lower:
            found_skills.append(skill)
            areas.add(area)

    if len(found_skills) <= 2:
        level = "Junior"
    elif len(found_skills) <= 4:
        level = "Pleno"
    else:
        level = "Senior"

    if len(areas) == 1:
        role = list(areas)[0]
    elif "Frontend" in areas and "Backend" in areas:
        role = "Full Stack"
    else:
        role = "General Developer"

    return {
        "skills": found_skills,
        "level": level,
        "role": role
    }


@router.post("/upload-cv")
async def upload_cv(
    file: UploadFile = File(...),
    user = Depends(get_current_user),
    db = Depends(get_db)
):
    file_id = str(uuid.uuid4())
    file_path = f"{UPLOAD_DIR}/{file_id}.pdf"

    content = await file.read()

    with open(file_path, "wb") as f:
        f.write(content)

    text = extract_text_from_pdf(file_path)

    if text.startswith("PDF_ERROR"):
        return {"error": text}

    ai_result = analyze_cv(text)

    try:
        cv = CV(
            id=file_id,
            file_path=file_path,
            text=text,
            ai_analysis=json.dumps(ai_result),
            user=user
        )

        db.add(cv)
        db.commit()

    except Exception as e:
        db.rollback()
        return {"error": str(e)}

    return {
        "message": "CV saved successfully",
        "file_id": file_id,
        "user": user,
        "ai_analysis": ai_result
    }


@router.get("/me")
def get_my_cvs(
    user = Depends(get_current_user),
    db = Depends(get_db)
):
    cvs = db.query(CV).filter(CV.user == user).all()

    return [
        {
            "file_id": cv.id,
            "file_path": cv.file_path,
            "ai_analysis": json.loads(cv.ai_analysis) if cv.ai_analysis else None
        }
        for cv in cvs
    ]