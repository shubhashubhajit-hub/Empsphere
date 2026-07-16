from typing import List, Dict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def chunk_text(text: str, chunk_size: int = 700, overlap: int = 100) -> List[str]:
    text = (text or "").strip()
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return [c.strip() for c in chunks if c.strip()]

def match_by_title(question: str, documents: List[Dict], top_k: int = 3) -> List[Dict]:
    q_words = set(w.lower() for w in question.replace("_", " ").replace("-", " ").split() if len(w) > 2)
    scored = []
    for doc in documents:
        title = doc.get("title", "")
        t_words = set(w.lower() for w in title.replace("_", " ").replace("-", " ").replace(".", " ").split() if len(w) > 2)
        if not t_words:
            continue
        overlap = q_words & t_words
        if not overlap:
            continue
        score = len(overlap) / len(t_words)
        scored.append((score, doc["id"], title))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [
        {"document_id": doc_id, "title": title, "snippet": "Matched by file name.", "confidence": round(score * 100, 1)}
        for score, doc_id, title in scored[:top_k]
        if score >= 0.4
    ]

def search_documents(question: str, documents: List[Dict], top_k: int = 3) -> List[Dict]:
    """
    documents: list of dicts: {id, title, text}
    Returns top_k matching chunks with a confidence score (0-100), across all documents.
    """
    corpus_chunks = []  # (doc_id, title, chunk_text)
    for doc in documents:
        for chunk in chunk_text(doc.get("text", "")):
            corpus_chunks.append((doc["id"], doc["title"], chunk))

    if not corpus_chunks:
        return []

    texts = [c[2] for c in corpus_chunks]
    try:
        vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
        matrix = vectorizer.fit_transform(texts + [question])
        question_vec = matrix[-1]
        doc_matrix = matrix[:-1]
        scores = cosine_similarity(question_vec, doc_matrix)[0]
    except ValueError:
        return []

    ranked = sorted(zip(scores, corpus_chunks), key=lambda x: x[0], reverse=True)
    results = []
    for score, (doc_id, title, chunk) in ranked:
        if score <= 0:
            continue
        results.append({
            "document_id": doc_id,
            "title": title,
            "snippet": chunk[:280],
            "confidence": round(float(score) * 100, 1),
        })
        if len(results) >= top_k:
            break
    return results
