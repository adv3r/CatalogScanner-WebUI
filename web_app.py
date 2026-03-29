"""Web interface for CatalogScanner � runs as a standalone FastAPI app."""

import logging
import os
import tempfile
import uuid

from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

import scanner

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB in bytes

app = FastAPI(title="CatalogScanner Web")
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

SCAN_MODES = ["auto", "catalog", "recipes", "critters", "reactions", "music"]

LOCALES = [
    "auto",
    "en-us", "en-eu",
    "de-eu",
    "es-eu", "es-us",
    "fr-eu", "fr-us",
    "it-eu",
    "ja-jp",
    "ko-kr",
    "nl-eu",
    "ru-eu",
    "zh-cn", "zh-tw",
]

MODE_LABELS = {
    "auto": "Auto-detect",
    "catalog": "Nook Shopping Catalog",
    "recipes": "DIY Recipes",
    "critters": "Critter Encyclopedia",
    "reactions": "Reactions",
    "music": "K.K. Songs",
}

LOCALE_LABELS = {
    "auto": "Auto-detect",
    "en-us": "English (US)",
    "en-eu": "English (EU)",
    "de-eu": "German",
    "es-eu": "Spanish (EU)",
    "es-us": "Spanish (US)",
    "fr-eu": "French (EU)",
    "fr-us": "French (US)",
    "it-eu": "Italian",
    "ja-jp": "Japanese",
    "ko-kr": "Korean",
    "nl-eu": "Dutch",
    "ru-eu": "Russian",
    "zh-cn": "Chinese (Simplified)",
    "zh-tw": "Chinese (Traditional)",
}


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "modes": SCAN_MODES,
            "mode_labels": MODE_LABELS,
            "locales": LOCALES,
            "locale_labels": LOCALE_LABELS,
        },
    )


@app.post("/scan", response_class=JSONResponse)
async def scan_file(
    file: UploadFile = File(...),
    mode: str = Form("auto"),
    locale: str = Form("auto"),
    for_sale: bool = Form(False),
):
    # Validate extension � use only the extension, never raw filename
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return JSONResponse(
            status_code=400,
            content={"error": f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"},
        )

    # Validate mode against known whitelist
    if mode not in SCAN_MODES:
        return JSONResponse(status_code=400, content={"error": "Invalid scan mode."})

    # Validate locale against known whitelist
    if locale not in LOCALES:
        return JSONResponse(status_code=400, content={"error": "Invalid locale."})

    # Stream upload to temp file while enforcing size limit
    tmp_path = os.path.join(tempfile.gettempdir(), f"catalog_scan_{uuid.uuid4().hex}{ext}")
    try:
        total_bytes = 0
        with open(tmp_path, "wb") as out:
            while True:
                chunk = file.file.read(256 * 1024)  # 256 KB chunks
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > MAX_FILE_SIZE:
                    return JSONResponse(
                        status_code=413,
                        content={"error": "File exceeds the 500 MB size limit."},
                    )
                out.write(chunk)

        result = scanner.scan_media(tmp_path, mode=mode, locale=locale, for_sale=for_sale)

        return {
            "mode": result.mode.name.capitalize(),
            "locale": result.locale,
            "count": len(result.items),
            "items": sorted(result.items),
            "unmatched": result.unmatched,
        }

    except AssertionError as e:
        return JSONResponse(status_code=422, content={"error": str(e)})
    except Exception:
        logger.exception("Unhandled error during scan")
        return JSONResponse(
            status_code=500,
            content={"error": "An internal error occurred. Check server logs for details."},
        )
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
