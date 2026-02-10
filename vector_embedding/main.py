from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import numpy as np
import threading, time
import logging

import faiss_store_match as store
from vectorization import create_weighted_vector

logging.basicConfig(level=logging.INFO)

MATCH_THRESHOLD = 0.30  # 🔥 30%

app = FastAPI(title="Dating App Matching API")

# ---------- AUTOSAVE ----------
def autosave():
    while True:
        time.sleep(30)
        with store.index_lock:
            store.save_indexes()

threading.Thread(target=autosave, daemon=True).start()

# ---------- SCHEMAS ----------
class RegisterRequest(BaseModel):
    rollno: str
    responses: List[str]

class MatchRequest(BaseModel):
    rollno: str
    gender: str
    top_k: int = 50

# ---------- STARTUP ----------
@app.on_event("startup")
def startup():
    store.load_indexes()

# ---------- HEALTH ----------
@app.get("/health")
def health():
    return {"status": "ok"}

# ---------- REGISTER ----------
@app.post("/user/register")
def register_user(data: RegisterRequest):
    if len(data.responses) != 10:
        raise HTTPException(400, "Invalid responses")

    gender = data.responses[4].upper()
    if gender not in ("MALE", "FEMALE"):
        raise HTTPException(400, "Invalid gender")

    with store.index_lock:
        # 🔥 REMOVE USER EVERYWHERE
        store.remove_user_vector(data.rollno)
        store.remove_user_from_disk(data.rollno)

        # ADD FRESH
        vector = create_weighted_vector(data.responses)
        store.add_user_vector(data.rollno, vector, gender)
        store.save_indexes()

    return {"status": "success"}

# ---------- MATCHES ----------
@app.post("/matches")
def find_matches(data: MatchRequest):
    gender = data.gender.upper()

    if gender == "MALE":
        if data.rollno not in store.male_rollno_vectors:
            raise HTTPException(404, "User not found")
        query_vector = store.male_rollno_vectors[data.rollno]
    else:
        if data.rollno not in store.female_rollno_vectors:
            raise HTTPException(404, "User not found")
        query_vector = store.female_rollno_vectors[data.rollno]

    results = store.search(query_vector, data.top_k + 1, gender)

    matches = [
        {"rollno": uid, "similarity": round(score, 2)}
        for uid, score in results
        if uid != data.rollno and score >= MATCH_THRESHOLD
    ]

    return {"matches": matches}

# ---------- SCORE ----------
@app.get("/score")
def score(maleRollNo: str, femaleRollNo: str):
    if maleRollNo not in store.male_rollno_vectors:
        raise HTTPException(404, "Male not found")
    if femaleRollNo not in store.female_rollno_vectors:
        raise HTTPException(404, "Female not found")

    score = float(
        np.dot(
            store.male_rollno_vectors[maleRollNo],
            store.female_rollno_vectors[femaleRollNo]
        )
    )

    return {"score": round(score, 2)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=6969)
