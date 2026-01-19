FROM python:3.11-slim

WORKDIR /app

# Copy requirements from current directory (backend/) to /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend directory content into /app/backend
# We assume the build context is the 'backend' folder, so we copy '.' to 'backend/'
# creating a package structure inside the container.
COPY . backend/

ENV PYTHONPATH=/app

# Run as a module
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
