FROM python:3.11-slim

WORKDIR /app

COPY backend/ .

RUN pip install --no-cache-dir \
    fastapi==0.136.1 \
    uvicorn==0.47.0 \
    sqlalchemy==2.0.49 \
    psycopg2-binary==2.9.12 \
    "python-jose[cryptography]==3.5.0" \
    "passlib[bcrypt]==1.7.4" \
    bcrypt==4.0.1 \
    pdfplumber \
    PyMuPDF \
    python-dotenv==1.2.2 \
    python-multipart==0.0.29 \
    pydantic==2.13.4

RUN mkdir -p uploads

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
