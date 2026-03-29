FROM python:3.11-slim

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
    tesseract-ocr-script-latn \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    ffmpeg \
    && mkdir -p /usr/share/tesseract-ocr/5/tessdata/script \
    && ln -s /usr/share/tesseract-ocr/5/tessdata/Latin.traineddata \
             /usr/share/tesseract-ocr/5/tessdata/script/Latin.traineddata \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -r -u 1001 -s /bin/false appuser

WORKDIR /app

COPY requirements.txt requirements.web.txt ./
RUN pip install --no-cache-dir -r requirements.txt -r requirements.web.txt

COPY --chown=appuser . .

USER appuser

EXPOSE 8086

CMD ["uvicorn", "web_app:app", "--host", "0.0.0.0", "--port", "8086"]
