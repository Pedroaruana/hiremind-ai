from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import os
import uuid
import json
from datetime import datetime
import pdfplumber

from app.services.auth_dependency import get_current_user
from app.database.connection import SessionLocal
from app.models.cv_model import CV

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE_MB = 2
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
MAX_PDF_PAGES = 10
MAX_CVS_PER_USER = 10
ALLOWED_CONTENT_TYPES = {"application/pdf"}
ALLOWED_EXTENSIONS = {".pdf"}


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
            for page in pdf.pages[:MAX_PDF_PAGES]:
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
        "vue": "Frontend",
        "angular": "Frontend",
        "node": "Backend",
        "express": "Backend",
        "fastapi": "Backend",
        "django": "Backend",
        "flask": "Backend",
        "javascript": "Full Stack",
        "typescript": "Full Stack",
        "python": "Backend",
        "java": "Backend",
        "sql": "Database",
        "postgresql": "Database",
        "mongodb": "Database",
        "redis": "Database",
        "html": "Frontend",
        "css": "Frontend",
        "docker": "DevOps",
        "git": "DevOps",
        "aws": "DevOps",
    }

    found_skills = []
    areas = set()

    for skill, area in skills_db.items():
        if skill in text_lower:
            found_skills.append(skill)
            areas.add(area)

    # Nível baseado em palavras-chave de experiência
    senior_keywords = ["senior", "sênior", "lead", "arquiteto", "architect", "tech lead"]
    pleno_keywords = ["pleno", "mid", "analista", "analyst"]
    junior_keywords = ["junior", "júnior", "estagiário", "trainee", "intern"]

    if any(k in text_lower for k in senior_keywords) or len(found_skills) >= 7:
        level = "Sênior"
        base_score = 80
    elif any(k in text_lower for k in pleno_keywords) or len(found_skills) >= 4:
        level = "Pleno"
        base_score = 60
    elif any(k in text_lower for k in junior_keywords) or len(found_skills) >= 2:
        level = "Júnior"
        base_score = 40
    else:
        level = "Júnior"
        base_score = 25

    # Score final
    skill_bonus = min(len(found_skills) * 2, 15)
    has_contact = any(k in text_lower for k in ["email", "@", "linkedin", "github", "telefone", "phone"])
    has_education = any(k in text_lower for k in ["universidade", "faculdade", "graduação", "bacharelado", "curso", "college", "university"])
    contact_bonus = 3 if has_contact else 0
    education_bonus = 5 if has_education else 0
    score = min(100, base_score + skill_bonus + contact_bonus + education_bonus)

    # Role
    if "Frontend" in areas and "Backend" in areas:
        role = "Full Stack"
    elif "Frontend" in areas:
        role = "Frontend Developer"
    elif "Backend" in areas:
        role = "Backend Developer"
    elif "DevOps" in areas:
        role = "DevOps Engineer"
    else:
        role = "Developer"

    # Sub-scores
    format_score = min(100, score + 8)
    content_score = max(0, score - 5)
    keyword_score = min(100, len(found_skills) * 6)

    # Summary automático
    summary = (
        f"Candidato {level} com {len(found_skills)} habilidades técnicas identificadas. "
        f"Perfil voltado para {role}. "
        f"Score geral de {score}/100 baseado em habilidades, formação e completude do currículo."
    )

    # Dicas de melhoria
    tips = []
    if not has_contact:
        tips.append("Adicione informações de contato como e-mail, LinkedIn ou GitHub.")
    if not has_education:
        tips.append("Inclua sua formação acadêmica ou cursos relevantes.")
    if len(found_skills) < 5:
        tips.append("Liste mais habilidades técnicas para aumentar sua visibilidade.")
    if "github" not in text_lower:
        tips.append("Adicione o link do seu GitHub para mostrar projetos práticos.")
    if len(text) < 500:
        tips.append("Seu currículo parece muito curto. Adicione mais detalhes sobre experiências.")
    has_projects = any(k in text_lower for k in ["projeto", "project", "portfólio", "portfolio", "app", "sistema", "desenvolveu", "criou"])
    if not has_projects:
        tips.append("Adicione projetos pessoais ou link do portfólio para destacar experiência prática.")

    if level == "Júnior":
        tips.append("Plataformas como Rocketseat, Alura e DIO têm trilhas completas para dev iniciante — vale muito investir.")
    elif level == "Pleno":
        tips.append("Certificações como AWS Cloud Practitioner ou Google Associate Cloud Engineer valorizam bastante o perfil de Pleno.")
    else:
        tips.append("Contribuir para projetos open source no GitHub é um diferencial forte para perfis Sênior.")

    tips.append("Personalize o currículo para cada vaga destacando as habilidades mais relevantes para aquela empresa.")
    tips.append("Atualize seu currículo a cada 3-6 meses para refletir novas experiências e tecnologias aprendidas.")

    if not tips:
        tips.append("Currículo bem estruturado! Mantenha-o atualizado regularmente.")

    return {
        "skills": found_skills,
        "level": level,
        "role": role,
        "score": score,
        "summary": summary,
        "tips": tips,
        "format_score": format_score,
        "content_score": content_score,
        "keyword_score": keyword_score,
    }


@router.post("/upload-cv")
async def upload_cv(
    file: UploadFile = File(...),
    user = Depends(get_current_user),
    db = Depends(get_db)
):
    count = db.query(CV).filter(CV.user == user).count()
    if count >= MAX_CVS_PER_USER:
        raise HTTPException(status_code=400, detail="Limite de 10 currículos atingido. Delete um antes de enviar outro.")

    # Validação de extensão
    ext = os.path.splitext(file.filename or "")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são aceitos.")

    # Validação de content-type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de arquivo inválido. Envie um PDF.")

    content = await file.read()

    # Validação de tamanho
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail=f"Arquivo muito grande. Máximo: {MAX_FILE_SIZE_MB}MB.")

    file_id = str(uuid.uuid4())
    file_path = f"{UPLOAD_DIR}/{file_id}.pdf"

    with open(file_path, "wb") as f:
        f.write(content)

    text = extract_text_from_pdf(file_path)

    if text.startswith("PDF_ERROR"):
        os.remove(file_path)
        raise HTTPException(status_code=422, detail="Não foi possível ler o PDF. Verifique o arquivo.")

    ai_result = analyze_cv(text)

    try:
        cv = CV(
            id=file_id,
            file_path=file_path,
            text=text,
            ai_analysis=json.dumps(ai_result),
            user=user,
            created_at=datetime.utcnow()
        )
        db.add(cv)
        db.commit()
    except Exception as e:
        db.rollback()
        os.remove(file_path)
        raise HTTPException(status_code=500, detail="Erro ao salvar o CV.")

    return {
        "message": "CV salvo com sucesso.",
        "file_id": file_id,
        "ai_analysis": ai_result
    }


@router.post("/analyze-guest")
async def analyze_guest(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são aceitos.")

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de arquivo inválido. Envie um PDF.")

    content = await file.read()

    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail=f"Arquivo muito grande. Máximo: {MAX_FILE_SIZE_MB}MB.")

    file_id = str(uuid.uuid4())
    file_path = f"{UPLOAD_DIR}/{file_id}.pdf"

    with open(file_path, "wb") as f:
        f.write(content)

    text = extract_text_from_pdf(file_path)
    os.remove(file_path)

    if text.startswith("PDF_ERROR"):
        raise HTTPException(status_code=422, detail="Não foi possível ler o PDF. Verifique o arquivo.")

    ai_result = analyze_cv(text)

    return {
        "file_id": file_id,
        "ai_analysis": ai_result
    }


@router.get("/me")
def get_my_cvs(
    user = Depends(get_current_user),
    db = Depends(get_db)
):
    cvs = db.query(CV).filter(CV.user == user).order_by(CV.created_at.desc()).all()

    return [
        {
            "file_id": cv.id,
            "ai_analysis": json.loads(cv.ai_analysis) if cv.ai_analysis else None,
            "created_at": cv.created_at.isoformat() if cv.created_at else None
        }
        for cv in cvs
    ]


@router.delete("/{file_id}")
def delete_cv(
    file_id: str,
    user = Depends(get_current_user),
    db = Depends(get_db)
):
    cv = db.query(CV).filter(CV.id == file_id, CV.user == user).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV não encontrado.")

    if cv.file_path and os.path.exists(cv.file_path):
        os.remove(cv.file_path)

    db.delete(cv)
    db.commit()
    return {"message": "CV deletado com sucesso."}