FROM python:3.11-slim

# System dependencies: Tesseract OCR + all language packs + OpenCV libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-deu \
    tesseract-ocr-spa \
    tesseract-ocr-fra \
    tesseract-ocr-ita \
    tesseract-ocr-jpn \
    tesseract-ocr-kor \
    tesseract-ocr-nld \
    tesseract-ocr-rus \
    tesseract-ocr-chi-sim \
    tesseract-ocr-chi-tra \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install script/Latin tessdata (not available as apt package)
COPY Latin.traineddata /usr/share/tesseract-ocr/5/tessdata/script/Latin.traineddata

WORKDIR /app

# Install Python scanner deps first (changes infrequently � better layer cache)
COPY requirements.txt requirements.web.txt ./
RUN pip install --no-cache-dir -r requirements.txt -r requirements.web.txt

# Copy project files (.dockerignore excludes bot files, tests, docs, etc.)
COPY . .

# Run as non-root user
RUN useradd -r -u 1001 -s /bin/false appuser \
    && chown -R appuser /app
USER appuser

EXPOSE 8086

CMD ["uvicorn", "web_app:app", "--host", "0.0.0.0", "--port", "8086"]
