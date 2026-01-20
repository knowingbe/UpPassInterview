FROM python:3.11-slim

WORKDIR /app

# Cài đặt dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ code vào /app
COPY . .

# Đảm bảo Python tìm thấy các module trong thư mục hiện tại
ENV PYTHONPATH=/app

# Chạy app (Sử dụng lệnh linh hoạt)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
