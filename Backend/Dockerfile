# 1. Base Image (Lightweight Python)
FROM python:3.10-slim

# 2. Set the working directory to the root of the container
# We use /code so it's clear this is where the project lives
WORKDIR /code

# 3. Environment Variables
# Prevents Python from writing pyc files to disc
ENV PYTHONDONTWRITEBYTECODE=1
# Prevents Python from buffering stdout/stderr (better logs)
ENV PYTHONUNBUFFERED=1
# Adds /code to PYTHONPATH so 'app.main' imports work correctly
ENV PYTHONPATH=/code

# 4. Install System Dependencies
# (gcc and python3-dev are often needed for compiling libraries)
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# 5. Install Python Dependencies
# Copy just requirements first (to cache this layer)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 6. Copy the Application Code
# This copies your local 'app' folder into '/code/app' inside container
COPY app/ ./app/

# 7. Default Command
# This is a placeholder. It will be overridden by docker-compose
# But if you ran this image standalone, it would start the API
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]