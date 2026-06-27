# Hello, I'm Kultum Lhabaik

Welcome to my project portfolio — a collection of work spanning full-stack development, data science, and applied machine learning. Each project below tackles a real-world problem with a different tech stack and approach.

---

## Featured Projects

### [CompanyInsider — AI Company Research Platform](./CompanyInsider)

> Analyst-grade company research, for everyone.

CompanyInsider turns SEC filings and live market data into clear, source-grounded insights about public companies. Its standout feature is an **agentic AI analyst** built on Google Gemini function calling: the model autonomously chooses its own tools, running **semantic RAG** over a company's annual report (sentence-transformers embeddings with cosine-similarity retrieval) alongside live price, financials, and news lookups, then tags every fact with its source. Beyond chat, it generates web-grounded briefings, competitor analysis, and investment theses, and ships with a configurable Trend Tracker alerts engine, user watchlists, and authentication via Supabase row-level security.

**Stack:** React · Vite · Tailwind CSS · FastAPI · Python · Google Gemini API · sentence-transformers · yfinance · SEC EDGAR · Supabase · Vercel · Hugging Face

🔗 [Web Application](https://companyinsider-six.vercel.app)

---

### [MedTrace — Medication & Symptom Tracker with AI Summaries](./MedTrace)

> Organize and communicate health information — never diagnose.

MedTrace is a full-stack medication and symptom tracker with a caregiver mode and an AI summarization layer that stays deliberately in a *summarizing*, never *advising*, role. Adding a medication pulls live purpose, warnings, and side effects from the **OpenFDA** drug label API. Its AI layer is built on a careful boundary: transparent, code-owned rules decide what trends are notable (rising pain, low mood, missed-dose clusters), and **Google Gemini** only phrases the already-detected findings — never diagnosing or advising. A **retrieval-augmented (RAG)** layer grounds summaries in the patient's own FDA drug facts via semantic vector search (**pgvector** + Gemini embeddings, cosine distance). Rounding it out: a consent-based caregiver authorization model with full audit attribution, automated missed-dose email alerts via Resend, and downloadable PDF health reports. Deployed across three tiers.

**Stack:** Java 25 · Spring Boot · Spring Security + JWT · PostgreSQL + pgvector · React Native · Expo · TypeScript · Google Gemini API · OpenFDA · Resend · Docker · Supabase · Render · Vercel

🔗 [Web Application](https://medtrace-red.vercel.app) 

---

### [DueAble — Smart Assignment Tracker](./DueAble)

> Upload a syllabus. Get a planner. Never miss a due date.

DueAble is a full-stack assignment tracker that parses syllabi (PDF, image, or pasted text) and automatically extracts assignments, due dates, and course info into a calendar-style planner. It supports OCR for screenshots, AI-powered date repair via Google Gemini, and per-user data isolation through Supabase row-level security.

**Stack:** React Native · Expo · TypeScript · FastAPI · Python · Tesseract OCR · Google Gemini API · Supabase (Postgres) · Render · Netlify

🔗 [Live Demo](https://www.youtube.com/watch?v=zKdHSpMpHvE) 
🔗 [Web Application](https://pixelate-nkkto.netlify.app/login)

---

### [Modeling and Predicting Artist Career Decline in Music Streaming](./Modeling%20and%20Predicting%20Artist%20Career%20Decline%20)

> When do music artists peak — and what predicts the decline?

A two-stage data mining framework built on longitudinal Spotify data for 1,094 artists. Ward linkage clustering discovers **eight career archetypes** — from Catalog Risers (16% decline) to Legacy Faders (53% decline) — with statistically validated differences (χ² = 109.94, p < 0.0001). Gradient Boosting with F2-optimal threshold tuning catches **92% of real declines** (127/138) on a held-out test set. The most actionable finding: *Momentum Lost* artists (The Weeknd, Ariana Grande) are identifiable before decline accelerates, giving talent managers an early-warning signal.

**Stack:** Python · Jupyter Notebook · pandas · scikit-learn · XGBoost · Ward Clustering · PCA · Matplotlib

---

### [Nurse Practitioner Distribution Dashboard](./Nurse%20Practitioner%20Distribution)

> Mapping healthcare access gaps across Georgia's 159 counties.

An interactive choropleth dashboard that visualizes nurse practitioner availability by county, with views for NP count, NP density per 10,000 residents, and doctor-to-NP ratio. Includes demographic overlays (income, racial/ethnic composition) and rural/suburban/urban filtering to explore how provider access correlates with community characteristics.

**Stack:** Python · Plotly Dash · pandas · NumPy · Gunicorn · Render

🔗 [Live Dashboard](https://nursepractitionerdistributiondashboard18.onrender.com/)

---

## Other Projects in This Repo

| Project | Description |
|---------|-------------|
| [Carlo Museum Bias Detection](./Carlo%20Museum%20Bias%20Detection) | Multi-label BERT + GPT pipeline to detect cultural and linguistic bias in museum artifact descriptions |
| [Covid Data Project](./Covid%20Data%20Project) | SQL-based exploration of global COVID-19 death and vaccination data |
| [Fashion Blog](./Fashion%20Blog) | A responsive fashion blog built with HTML, CSS, and JavaScript |
| [Stocks](./Stocks) | Full-stack stock tracking app with a Python backend and React frontend |

---

## Languages & Tools

![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![Java](https://img.shields.io/badge/Java-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![R](https://img.shields.io/badge/R-276DC3?style=flat-square&logo=r&logoColor=white)
![SQL](https://img.shields.io/badge/SQL-4479A1?style=flat-square&logo=postgresql&logoColor=white)
![HTML](https://img.shields.io/badge/HTML-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-1572B6?style=flat-square&logo=css3&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-61DAFB?style=flat-square&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Plotly Dash](https://img.shields.io/badge/Plotly_Dash-3F4F75?style=flat-square&logo=plotly&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

---

## Get in Touch

Feel free to explore the projects and reach out if you'd like to connect or collaborate.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/kultum2026/)
[![Email](https://img.shields.io/badge/Email-D14836?style=flat-square&logo=gmail&logoColor=white)](mailto:Klhabaik@gmail.com)
