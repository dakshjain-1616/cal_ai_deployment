FROM python:3.12-slim

WORKDIR /app

# Install system deps for optional image libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libjpeg-dev \
    && rm -rf /var/lib/apt/lists/*

COPY ./requirements.txt /app/requirements.txt
RUN python -m pip install --upgrade pip
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY . /app

ENV PORT=8080
EXPOSE 8080

# Start Uvicorn on the expected port for container platforms
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
