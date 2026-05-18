🧠 HireMind AI

Sistema full-stack que utiliza inteligência artificial para analisar currículos automaticamente, extrair habilidades e classificar candidatos por nível de experiência.

📌 Sobre o Projeto

O HireMind AI permite que usuários façam upload de currículos em PDF e utiliza IA para extrair informações relevantes como:

🧩 Habilidades técnicas
📊 Nível de experiência (Júnior, Pleno, Sênior)
💼 Função sugerida (Frontend, Backend, Full Stack)

Os dados são exibidos em um dashboard interativo.

⚙️ Funcionalidades
📄 Upload de currículos em PDF
🧠 Análise automática com IA
🧩 Extração de habilidades técnicas
📊 Classificação de nível profissional
🔐 Autenticação com JWT
📡 API REST com FastAPI
💻 Dashboard em React
🛠️ Tecnologias Utilizadas
Backend
Python
FastAPI
JWT Authentication
SQLite / PostgreSQL
Frontend
React
Axios
Vite
JavaScript (ES6+)
📂 Estrutura do Projeto

backend/ → API e lógica do sistema
backend/cv-dashboard/ → Frontend (React)
README.md → Documentação

🚀 Como Executar o Projeto
1. Clonar o repositório

git clone https://github.com/Pedroaruana/hiremind-ai.git
cd hiremind-ai

2. Rodar o Backend

cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

Backend rodando em:
http://127.0.0.1:8000

3. Rodar o Frontend

cd backend/cv-dashboard
npm install
npm run dev

Frontend rodando em:
http://localhost:5173

🔐 Variáveis de Ambiente

Crie um arquivo .env dentro da pasta backend:

OPENAI_API_KEY=sua_chave_aqui