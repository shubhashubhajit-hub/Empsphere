import logging

logger = logging.getLogger("stacks.ocr")


def ocr_pdf(file_path: str) -> str:
    """
    Runs OCR over a PDF's pages and returns extracted text.
    Requires system packages `tesseract-ocr` and `poppler-utils`
    (already installed in the provided Dockerfile).
    """
    try:
        from pdf2image import convert_from_path
        import pytesseract

        pages = convert_from_path(file_path, dpi=200)
        text_parts = []
        for page in pages:
            text_parts.append(pytesseract.image_to_string(page))
        return "\n".join(text_parts).strip()
    except Exception as e:
        logger.warning(f"OCR failed for {file_path}: {e}")
        return ""


def needs_ocr(extracted_text: str) -> bool:
    """Heuristic: if normal text extraction returned almost nothing, the PDF is likely scanned."""
    return len((extracted_text or "").strip()) < 30
