import numpy as np
from embedder import embed_text

QUESTIONS = [
    "What makes you feel most alive these days?",
    "If you had a free evening with no responsibilities, how would you spend it?",
    "What small thing can instantly brighten your day?",
    "Which three words would your closest friend use to describe you?",
    "Gender",  # skipped
    "What are you secretly hoping college gives you before graduation?",
    "What do you value most in relationships?",
    "How do you usually show care or affection?",
    "What kind of person naturally catches your attention?",
    "If someone wrote a short poem about you after meeting once, what would its mood be?"
]

def create_weighted_vector(responses: list) -> np.ndarray:
    vectors = []

    for idx, answer in enumerate(responses):
        if idx == 4:  # skip gender
            continue

        answer = answer.strip()
        if not answer:
            continue

        # 🔥 CRITICAL: include question context
        text = f"{QUESTIONS[idx]} {answer}"

        emb = embed_text(text)
        vectors.append(emb)

    if not vectors:
        raise ValueError("No valid responses to embed")

    final_vector = np.mean(vectors, axis=0)

    # normalize once at the end
    return final_vector / np.linalg.norm(final_vector)
