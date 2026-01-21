FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all code into /app
COPY . .

# Ensure Python finds modules in the current directory
ENV PYTHONPATH=/app

# Run app (using flexible command)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
