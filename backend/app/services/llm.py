import json
import requests
from typing import List, Dict, Optional
from app.config import settings

try:
    from openai import OpenAI
    _openai_client = OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
except ImportError:
    _openai_client = None

_gemini_available = bool(settings.GEMINI_API_KEY)

_GEMINI_MODEL = "gemini-2.0-flash"
_GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{_GEMINI_MODEL}:generateContent"


def _call_gemini(prompt: str, max_tokens: int = 500) -> str:
    resp = requests.post(
        _GEMINI_URL,
        params={"key": settings.GEMINI_API_KEY},
        json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"maxOutputTokens": max_tokens},
        },
        timeout=30,
    )
    if resp.status_code != 200:
        raise Exception(f"{resp.status_code}: {resp.text[:300]}")
    data = resp.json()
    return data["candidates"][0]["content"]["parts"][0]["text"].strip()


def _pick_provider(preference: str = "auto") -> Optional[str]:
    if preference == "openai" and _openai_client:
        return "openai"
    if preference == "gemini" and _gemini_available:
        return "gemini"
    if preference == "auto":
        if _openai_client:
            return "openai"
        if _gemini_available:
            return "gemini"
    return None


def generate_answer(question: str, sources: List[Dict], model_pref: str = "auto") -> str:
    provider = _pick_provider(model_pref)

    if not provider:
        if not sources:
            return "No LLM API key is configured, so I can't answer general questions — and no matching document was found either. Add an OpenAI/Gemini key, or upload a relevant document."
        top = sources[0]
        return (
            f"No LLM API key is configured, so here's the best-matching excerpt found "
            f"in \"{top['title']}\" ({top['confidence']}% match):\n\n{top['snippet']}"
        )

    if sources:
        context = "\n\n".join(f"[{s['title']}]: {s['snippet']}" for s in sources)
        system_prompt = (
            "You are a helpful knowledge assistant. Some context from the organization's indexed "
            "documents is provided below. If it answers the question, use it and mention which "
            "document it came from. If it doesn't fully answer the question, use your own general "
            "knowledge to help as well, and make clear which part of your answer (if any) came from "
            "general knowledge rather than the uploaded documents. Be concise."
        )
        user_content = f"Context from indexed documents:\n{context}\n\nQuestion: {question}"
    else:
        system_prompt = (
            "You are a helpful, general-purpose AI assistant, similar to ChatGPT. No matching "
            "internal document was found for this question, so answer using your own general "
            "knowledge. Be clear, helpful, and concise."
        )
        user_content = question

    if provider == "openai":
        try:
            resp = _openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                max_tokens=500,
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            if sources:
                return f"(OpenAI call failed, showing best-matching excerpt instead: {e})\n\n{sources[0]['snippet']}"
            return f"(OpenAI call failed: {e})"

    if provider == "gemini":
        try:
            return _call_gemini(f"{system_prompt}\n\n{user_content}", max_tokens=500)
        except Exception as e:
            if sources:
                return f"(Gemini call failed, showing best-matching excerpt instead: {e})\n\n{sources[0]['snippet']}"
            return f"(Gemini call failed: {e})"

    return "Something went wrong generating a response. Please try again."


def llm_summarize(text: str, model_pref: str = "auto") -> Optional[str]:
    provider = _pick_provider(model_pref)
    prompt = f"Summarize the following document in 4-6 clear sentences:\n\n{text[:6000]}"

    if provider == "openai":
        try:
            resp = _openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300,
            )
            return resp.choices[0].message.content.strip()
        except Exception:
            return None

    if provider == "gemini":
        try:
            return _call_gemini(prompt, max_tokens=300)
        except Exception:
            return None

    return None


def llm_generate_quiz(text: str, num_questions: int, model_pref: str = "auto") -> Optional[List[Dict]]:
    provider = _pick_provider(model_pref)
    prompt = (
        f"Create {num_questions} multiple-choice quiz questions from this document text. "
        f"Return ONLY a JSON array, no markdown, no preamble, in this exact shape: "
        f'[{{"question": "...", "options": ["...","...","...","..."], "correct_answer": "..."}}]\n\n'
        f"Document text:\n{text[:6000]}"
    )

    raw = None
    if provider == "openai":
        try:
            resp = _openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=800,
            )
            raw = resp.choices[0].message.content.strip()
        except Exception:
            return None
    elif provider == "gemini":
        try:
            raw = _call_gemini(prompt, max_tokens=800)
        except Exception:
            return None
    else:
        return None

    if not raw:
        return None
    raw = raw.strip().strip("```json").strip("```").strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None