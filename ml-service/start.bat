@echo off
echo Starting ML Service...
call venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
