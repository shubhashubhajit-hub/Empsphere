import json
from typing import List, Dict, Optional
from app.config import settings

try:
    from openai import OpenAI
    _openai_client = OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
except ImportError:
    _openai_client = None

try:
    import google.generativeai as genai
    if settings.GEMINI_API_KEY:
        genai.configure(api_key=settings.GEMINI_API_KEY)
    _gemini_available = bool(settings.GEMINI_API_KEY)
except ImportError:
    _gemini_available = False


def _pick_provider(preference: str = "auto") -> Optional[str]:
    """Resolves a user's model preference to an actually-available provider."""
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
            model = genai.GenerativeModel("gemini-flash-latest")
            resp = model.generate_content(f"{system_prompt}\n\n{user_content}")
            return resp.text.strip()
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
            model = genai.GenerativeModel("gemini-flash-latest")
            resp = model.generate_content(prompt)
            return resp.text.strip()
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
            model = genai.GenerativeModel("gemini-flash-latest")
            resp = model.generate_content(prompt)
            raw = resp.text.strip()
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