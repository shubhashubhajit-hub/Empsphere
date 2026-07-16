from typing import List
from sklearn.feature_extraction.text import TfidfVectorizer
import re


def _split_sentences(text: str) -> List[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in sentences if len(s.strip()) > 20]


def extractive_summary(text: str, max_sentences: int = 5) -> str:
    """TF-IDF based extractive summary — picks the most representative sentences.
    Used when no LLM API key is configured, so summarization always works."""
    sentences = _split_sentences(text)
    if not sentences:
        return "Not enough text could be extracted from this document to summarize."
    if len(sentences) <= max_sentences:
        return " ".join(sentences)

    vectorizer = TfidfVectorizer(stop_words="english")
    try:
        matrix = vectorizer.fit_transform(sentences)
    except ValueError:
        return " ".join(sentences[:max_sentences])

    scores = matrix.sum(axis=1).A1
    top_idx = sorted(sorted(range(len(sentences)), key=lambda i: scores[i], reverse=True)[:max_sentences])
    return " ".join(sentences[i] for i in top_idx)


def summarize_document(text: str, llm_summarize_fn=None) -> str:
    if llm_summarize_fn:
        result = llm_summarize_fn(text)
        if result:
            return result
    return extractive_summary(text)
