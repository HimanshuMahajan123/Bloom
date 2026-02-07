import numpy as np
from embedder import embed_text
QUESTION_WEIGHTS = {"q1":1,
                    "q2":1,
                    "q3":1,
                    "q4":1,
                    "q5":1,
                    "q6":1,
                    "q7":1,
                    "q8":1,
                    "q9":1,
                    "q10":1,
                    }
def create_weighted_vector(responses: list) -> np.ndarray:
    final_vector = None

    for idx, answer in enumerate(responses):
        if idx == 4:  # gender question
            continue

        weight = QUESTION_WEIGHTS.get(f"q{idx+1}", 1.0)
        emb = embed_text(answer) * weight
        final_vector = emb if final_vector is None else final_vector + emb

    return final_vector / np.linalg.norm(final_vector)
