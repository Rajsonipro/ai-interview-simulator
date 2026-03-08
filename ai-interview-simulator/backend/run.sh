#!/bin/bash
# Run the FastAPI backend

# Load env variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
