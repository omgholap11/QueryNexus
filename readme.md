# QueryNexus ⚡

**QueryNexus** is an advanced and streamming **Retrieval-Augmented Generation (RAG)** platform designed to filter global noise and deliver high-precision intelligence. Unlike standard chatbots that hallucinate, QueryNexus acts as a deterministic **News Engine**, aggregating real-time data from trusted financial, technological, and geopolitical sources to answer complex queries with cited facts.

Built on a microservices architecture, it utilizes **Apache Kafka** for high-throughput event streaming and **Vector Search** to ground every AI response in reality.

---

## 🏗️ System Architecture

The application follows a **distributed, event-driven architecture** designed for scalability and fault tolerance.

### 1. Data Ingestion Layer (The Pipeline) 🌊
*   **Producers**: standalone scripts that fetch real-time headlines from external APIs (NewsAPI, Finnhub, Marketaux) every 15 minutes.
*   **Message Queue (Apache Kafka)**: Decouples data fetching from processing. Raw news is pushed to the `market-news` topic.
*   **Consumers (Background Workers)**: Python workers consume messages, perform **Smart Scraping** to fetch full article content, and deduplicate entries.

### 2. Intelligence Layer (The Brain) 🧠
*   **Vector Database (Pinecone)**: Stores semantic embeddings of news articles for highly efficient similarity search.
*   **RAG Engine**: When a user asks a question, the system retrieves the **Top-K** most relevant articles using MMR (Maximal Marginal Relevance) and feeds them into the LLM as context.
*   **Lifecycle Management**: Automated processes to maintain index freshness.

### 3. Application Layer (The Interface) 💻
*   **Backend (FastAPI)**: High-performance Async I/O server handling user requests, chat sessions, and authentication.
*   **Caching (Redis)**: Caches frequent queries, user sessions, and chat history for immediate context.
*   **Frontend (React)**: Clean, responsive UI built with Vite and TailwindCSS for seamless interaction.

---

## 🚀 Key Features

### 🧠 AI & RAG
*   **Zero-Hallucination Policy**: The AI is instructed to refuse answering if relevant news data is missing.
*   **Source Citation**: Every answer includes direct links to source articles (Bloomberg, Reuters, TechCrunch, etc.).
*   **Smart Context**: Filters news by similarity score (>0.85) to ensure only highly relevant data is used.

### 🛡️ Security & Performance
*   **Rate Limiting**: Implemented Token Bucket algorithm (via Redis + SlowAPI) to prevent abuse.
*   **HttpOnly Auth**: Secure session management using HttpOnly cookies to prevent XSS.
*   **Middleware**: Robust CORS configuration and trusted host validation.

### ⚡ Data Engineering
*   **Event-Driven**: Uses Kafka to handle bursts of news data without blocking the main API.
*   **Efficient Storage**: Implements deduplication logic (Semantic Check) before storage to prevent vector bloat.

---

## 🛠️ Tech Stack

<div align="center">
  <img src="https://cdn.worldvectorlogo.com/logos/fastapi.svg" alt="FastAPI" width="60" height="60" style="margin: 10px;" />
  <img src="https://upload.wikimedia.org/wikipedia/commons/2/29/Postgresql_elephant.svg" alt="PostgreSQL" width="60" height="60" style="margin: 10px;" />
  <img src="https://cdn.worldvectorlogo.com/logos/redis.svg" alt="Redis" width="60" height="60" style="margin: 10px;" />
  <img src="https://upload.wikimedia.org/wikipedia/commons/0/01/Apache_Kafka_logo.svg" alt="Kafka" width="60" height="60" style="margin: 10px;" />
  <img src="https://cdn.worldvectorlogo.com/logos/react-2.svg" alt="React" width="60" height="60" style="margin: 10px;" />
  <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg" alt="Tailwind" width="60" height="60" style="margin: 10px;" />
  <img src="https://avatars.githubusercontent.com/u/126733545?s=200&v=4" alt="LangChain" width="60" height="60" style="margin: 10px;" />
  <img src="https://cdn.worldvectorlogo.com/logos/docker.svg" alt="Docker" width="60" height="60" style="margin: 10px;" />
  <img src="https://avatars.githubusercontent.com/u/106571587?s=200&v=4" alt="ChromaDB" width="60" height="60" style="margin: 10px;" />
  <img src="https://cdn.worldvectorlogo.com/logos/python-5.svg" alt="Python" width="60" height="60" style="margin: 10px;" />
</div>
<br/>


### Backend
*   **Language**: Python 3.10+ 🐍
*   **Framework**: FastAPI (Async) ⚡
*   **Validation**: Pydantic 🔍
*   **ORM**: SQLAlchemy 🗄️

### Data & Infrastructure
*   **Streaming**: Apache Kafka (KRaft Mode) (Dockerized) 📨
*   **Vector DB**: ChromaDB🌲
*   **Primary DB**: PostgreSQL 🐘
*   **Caching**: Redis (Session mgmt & Rate Limiting) 🔴
*   **Containerization**: Docker & Docker Compose 🐳

### Frontend
*   **Framework**: React.js (Vite) ⚛️
*   **State Management**: Redux Toolkit 🔄
*   **Styling**: TailwindCSS 🎨
*   **Networking**: Axios (with Interceptors) 🌐

---

## 📂 Project Structure

```bash
QueryNexus/
├── Backend/
│   ├── app/
│   │   ├── AI_Engine/      # RAG Logic, Prompting, Retriever
│   │   ├── APIs/           # External News API and web scrapping Integrations
│   │   ├── Controllers/    # Business Logic
│   │   ├── Kafka/          # Event Streaming (Producers/Consumers)
│   │   ├── Models/         # Database Schemas (SQLAlchemy)
│   │   ├── Redis/          # Caching Layer
│   │   ├── Routes/         # API Endpoints
│   │   └── main.py         # App Entry Point
│   ├── Dockerfile
│   └── docker-compose.yml
└── Frontend/
    ├── src/
    │   ├── App/            # Store Configuration
    │   ├── Features/       # Redux Slices (Auth, Chat)
    │   ├── components/     # UI Components (Dashboard, Sidebar)
    │   └── pages/          # Page Views
    └── index.html
```

---

## ⚙️ Setup & Installation

### Prerequisites
*   Docker & Docker Compose
*   Python 3.10+
*   Node.js 18+

### 1. Infrastructure (Docker)
Start the core services (Postgres, Redis, Kafka, Zookeeper):
```bash
cd Backend
docker-compose up -d
```

### 2. Backend Setup
```bash
cd Backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Run the API Server
uvicorn app.main:app --reload
```

### 3. Kafka Workers
```bash
# Start the News Producer
python -m app.Kafka.Workers.producer

# Start the Ingestion Consumer
python -m app.Kafka.Workers.consumer
```

### 4. Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```

---



*QueryNexus - Beyond the Headlines. Behind the Trends.*