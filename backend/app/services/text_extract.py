from pypdf import PdfReader
from docx import Document as DocxDocument


def extract_text(file_path: str, file_type: str) -> str:
    try:
        if file_type == "pdf":
            reader = PdfReader(file_path)
            return "\n".join((page.extract_text() or "") for page in reader.pages)
        elif file_type == "docx":
            doc = DocxDocument(file_path)
            return "\n".join(p.text for p in doc.paragraphs)
        elif file_type == "txt":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
    except Exception as e:
        return f"[Could not extract text: {e}]"
    return ""


def detect_file_type(filename: str) -> str:
    ext = filename.lower().rsplit(".", 1)[-1]
    if ext in ("pdf", "docx", "txt"):
        return ext
    return "unknown"
