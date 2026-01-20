FROM python:3.11-slim

WORKDIR /app

# Copy requirements from current directory (backend/) to /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy everything
COPY . .

WORKDIR /app/backend

# Run from inside backend
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
