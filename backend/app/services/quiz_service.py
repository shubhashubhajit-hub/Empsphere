import re
import random
from typing import List, Dict


def _split_sentences(text: str) -> List[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in sentences if 40 < len(s.strip()) < 220]


def naive_quiz(text: str, num_questions: int = 5) -> List[Dict]:
    """
    Fallback quiz generator with no LLM required: turns sentences into
    fill-in-the-blank questions by blanking out a significant word,
    with distractor options pulled from other sentences' words.
    """
    sentences = _split_sentences(text)
    if len(sentences) < 2:
        return []

    random.shuffle(sentences)
    all_words = list({w.strip('.,;:()"\'') for s in sentences for w in s.split() if len(w) > 5 and w[0].isupper() is False})

    questions = []
    for sentence in sentences[:num_questions]:
        words = [w for w in sentence.split() if len(w.strip('.,;:()"\'')) > 5]
        if not words:
            continue
        target = random.choice(words)
        clean_target = target.strip('.,;:()"\'')
        blanked = sentence.replace(target, "_____", 1)

        distractors = random.sample([w for w in all_words if w != clean_target], min(3, len(all_words)))
        options = distractors + [clean_target]
        random.shuffle(options)

        questions.append({
            "question": f"Fill in the blank: {blanked}",
            "options": options,
            "correct_answer": clean_target,
        })

    return questions


def generate_quiz(text: str, num_questions: int = 5, llm_quiz_fn=None) -> List[Dict]:
    if llm_quiz_fn:
        result = llm_quiz_fn(text, num_questions)
        if result:
            return result
    return naive_quiz(text, num_questions)
