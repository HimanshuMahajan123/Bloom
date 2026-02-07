from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List
import faiss_store_match as store
from vectorization import create_weighted_vector
import threading, time
import numpy as np



def autosave():
    while True:
        time.sleep(30)
        store.save_indexes()

threading.Thread(target=autosave, daemon=True).start()
    
app = FastAPI(title="Dating App Matching API")
user_genders = {}
threshold = 60
# ------------------ Schemas ------------------


class RegisterRequest(BaseModel):
    rollno: str
    responses: List[str]

class MatchRequest(BaseModel):
    rollno: str
    gender: str        # ⬅ explicit
    top_k: int = 50

# ------------------ APIs ------------------
@app.on_event("startup")
def startup():
    store.load_indexes()
@app.post("/user/register")
def register_user(data: RegisterRequest):
    if len(data.responses) != 10:
        raise HTTPException(status_code=400, detail="Invalid responses")

    gender = data.responses[4].upper()
    if gender not in ("MALE", "FEMALE"):
        raise HTTPException(status_code=400, detail="Invalid gender")

    vector = create_weighted_vector(data.responses)
    store.add_user_vector(data.rollno, vector, gender)

    store.save_indexes()   # 🔥 ADD THIS LINE
    print("STORE males:", store.male_rollno_vectors.keys())
    print("STORE females:", store.female_rollno_vectors.keys())

    return {
        "status": "success",
        "message": "User vector stored"
    }

@app.post("/matches")
def find_matches(data: MatchRequest):
    gender = data.gender.upper()
    if gender not in ("MALE", "FEMALE"):
        raise HTTPException(status_code=400, detail="Invalid gender")

    if gender == "MALE":
        if data.rollno not in store.male_rollno_vectors:
            raise HTTPException(status_code=404, detail="User not found")
        query_vector = store.male_rollno_vectors[data.rollno]
    else:
        if data.rollno not in store.female_rollno_vectors:
            raise HTTPException(status_code=404, detail="User not found")
        query_vector = store.female_rollno_vectors[data.rollno]
    results = store.search(query_vector, data.top_k + 1, gender)

    # remove self
    filtered = [(uid, score) for uid, score in results if uid != data.rollno]

    matches = []
    for uid, score in filtered:
        if score >= threshold:   # absolute threshold (recommended)
            matches.append({
                "rollno": uid,
                "similarity": round(score, 2)
            })

    return {"matches": matches}
@app.get("/score")
def get_score(maleRollNo: str, femaleRollNo: str):

    if maleRollNo not in store.male_rollno_vectors:
        raise HTTPException(status_code=404, detail="Male not found")

    if femaleRollNo not in store.female_rollno_vectors:
        raise HTTPException(status_code=404, detail="Female not found")

    male_vec = store.male_rollno_vectors[maleRollNo]
    female_vec = store.female_rollno_vectors[femaleRollNo]

    score = float(np.dot(male_vec, female_vec))
    return {"score": round(score, 2)}

if(__name__ == "__main__"):
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=6969)