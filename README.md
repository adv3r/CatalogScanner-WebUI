# CatalogScanner — Web UI

> A self-hosted web interface for [CatalogScanner](https://github.com/EhsanKia/CatalogScanner) by **Ehsan Kia**.  
> Scan your *Animal Crossing: New Horizons* catalog, recipes, critters, songs and reactions — without Discord.

![Python](https://img.shields.io/badge/python-3.11-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?logo=fastapi&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Built with GitHub Copilot](https://img.shields.io/badge/built%20with-GitHub%20Copilot-8957e5?logo=github&logoColor=white)

---

## What is this?

The original **CatalogScanner** is a Python + OCR tool that reads video or screenshot recordings of in-game menus from *Animal Crossing: New Horizons* and extracts the full list of items you own. It was built to power a Twitter bot and a Discord bot.

This fork adds a **self-hosted web UI** — a FastAPI server with a browser-based interface — so you can run it as a local app (e.g. on a home server like TrueNAS SCALE) without needing Discord or any cloud services.

**What's new in this fork:**

| Added file | Purpose |
|---|---|
| `web_app.py` | FastAPI server — handles file uploads and calls `scan_media()` |
| `templates/index.html` | Single-page web UI (Animal Crossing-themed, fully responsive) |
| `Dockerfile` | Container image with Python 3.11, Tesseract OCR and all dependencies |
| `docker-compose.yml` | Ready-to-use Compose config for TrueNAS SCALE or any Docker host |

---

## Features

- **Drag & drop** upload of video (MP4, MOV, AVI, MKV) or screenshots (PNG, JPG)
- Auto-detect or manual selection of **scan mode** (Catalog, DIY Recipes, Critters, Reactions, K.K. Songs)
- **14 languages / locales** supported (same as the original scanner)
- Optional **for-sale filter** (catalog mode)
- Results displayed in a searchable table
- **Copy to clipboard** and **Export as .txt**
- Animated progress bar during scanning
- Fully responsive — works on mobile browsers
- Animal Crossing cozy beige/brown/green theme 🍂

---

## How it works

```
Browser  →  HTTP POST /scan (multipart file)
              ↓
          web_app.py  →  scanner.scan_media()
                              ↓
                        OpenCV reads video frames
                              ↓
                        Tesseract OCR extracts text
                              ↓
                        Fuzzy-matched against item database (JSON)
                              ↓
          JSON response with { mode, locale, count, items[], unmatched[] }
              ↓
Browser  →  Renders table, enables filter/copy/export
```

The core scanning logic is **unchanged** from the original project — this fork only adds the HTTP layer on top.

---

## Requirements

- **Docker** (recommended) — or Python 3.11+ with Tesseract OCR installed locally
- At least **1 GB RAM** (Tesseract + OpenCV are memory-hungry)
- Video files must be **720p or 1080p** recordings of scrolling through in-game menus

---

## Installation & Usage

### Option A — Docker (recommended)

```bash
# 1. Clone this repo
git clone https://github.com/adv3r/CatalogScanner-WebUI.git
cd CatalogScanner-WebUI

# 2. Build the Docker image
docker build -t catalog-scanner:latest .

# 3. Run
docker compose up -d
```

Open `http://localhost:8086` in your browser.

---

### Option B — TrueNAS SCALE (Custom App via YAML)

1. Build the image over SSH on your TrueNAS box:

```bash
ssh admin@<truenas-ip>
cd /mnt/<pool>/catalog-scanner
docker build -t catalog-scanner:latest .
mkdir -p /mnt/<pool>/catalog-scanner/tmp
```

2. In the TrueNAS UI: **Apps → Install via YAML**, paste the contents of `docker-compose.yml` and click **Save**.

3. The app will appear in your Apps list and can be started/stopped from the UI.

---

### Option C — Local Python (no Docker)

Requirements: Python 3.11+, [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) with language packs installed.

```bash
pip install -r requirements.txt
pip install fastapi "uvicorn[standard]" jinja2 python-multipart

uvicorn web_app:app --host 0.0.0.0 --port 8086
```

---

## Configuration

The port is set in `docker-compose.yml` (default: **8086**). To change it:

```yaml
ports:
  - "YOUR_PORT:8086"
```

The `TESSDATA_PREFIX` environment variable points to Tesseract's data directory — set automatically inside the Docker image.

---

## Credits & Attribution

This project is a fork of and fully based on **CatalogScanner** by [Ehsan Kia](https://github.com/EhsanKia):

> **Original repository:** https://github.com/EhsanKia/CatalogScanner  
> **License:** MIT — Copyright (c) 2020 Ehsan Kia

All core scanning logic belong to the original project and its contributors.

The web UI layer (FastAPI server, HTML/CSS interface, Dockerfile, Compose config) was developed with the assistance of **GitHub Copilot**.

Item name data from the original project comes from:
- https://tinyurl.com/acnh-sheet
- https://github.com/imthe666st/ACNH
- https://github.com/alexislours/translation-sheet-data

---

## License

This fork is distributed under the same **MIT License** as the original project.  
See [LICENSE](LICENSE) for details.
