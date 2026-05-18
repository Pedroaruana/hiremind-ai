# 🧠 HireMind AI - Sistema de Análise de Currículos com Inteligência Artificial

Sistema full-stack que utiliza inteligência artificial para analisar currículos automaticamente, extrair habilidades e classificar candidatos por nível de experiência e função.

---

## 📌 Sobre o Projeto

O **HireMind AI** permite que usuários façam upload de currículos em PDF, que são processados por uma API com IA para extração de informações relevantes como:

- Habilidades técnicas
- Nível de experiência (Júnior, Pleno, Sênior)
- Função sugerida (ex: Full Stack, Frontend, Backend)

Os dados são exibidos em um dashboard web.

---

## ⚙️ Funcionalidades

- 📄 Upload de currículos em PDF  
- 🧠 Análise automática com IA  
- 🧩 Extração de habilidades técnicas  
- 📊 Classificação de nível profissional  
- 🔐 Autenticação com JWT  
- 📡 API REST com FastAPI  
- 💻 Dashboard em React  

---

## 🛠️ Tecnologias Utilizadas

### Backend:
- Python  
- FastAPI  
- JWT Authentication  
- SQLite / PostgreSQL  

### Frontend:
- React  
- Axios  
- JavaScript (ES6+)  
- Vite  

---

## 🚀 Como Executar o Projeto

### 1️⃣ Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload 

Frontend
cd backend/cv-dashboard
npm install
npm run dev