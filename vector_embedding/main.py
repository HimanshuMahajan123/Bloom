from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List

from faiss_store_match import add_user_vector, search, male_rollno_vectors,female_rollno_vectors,male_id_to_user,female_id_to_user
from vectorization import create_weighted_vector

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

@app.post("/user/register")
def register_user(data: RegisterRequest):
    if len(data.responses) != 10:
        raise HTTPException(status_code=400, detail="Invalid responses")

    gender = data.responses[4].lower()
    if gender not in ("male", "female"):
        raise HTTPException(status_code=400, detail="Invalid gender")

    vector = create_weighted_vector(data.responses)
    add_user_vector(data.rollno, vector, gender)

    return {
        "status": "success",
        "message": "User vector stored"
    }

@app.post("/matches")
def find_matches(data: MatchRequest):
    gender = data.gender.lower()
    if gender not in ("male", "female"):
        raise HTTPException(status_code=400, detail="Invalid gender")

    if gender == "male":
        if data.rollno not in male_rollno_vectors:
            raise HTTPException(status_code=404, detail="User not found")
        query_vector = male_rollno_vectors[data.rollno]
    else:
        if data.rollno not in female_rollno_vectors:
            raise HTTPException(status_code=404, detail="User not found")
        query_vector = female_rollno_vectors[data.rollno]

    results = search(query_vector, data.top_k + 1, gender)

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
    if maleRollNo not in male_rollno_vectors or femaleRollNo not in female_rollno_vectors:
        raise HTTPException(status_code=404, detail="User not found")
    male_vector = male_rollno_vectors[maleRollNo]
    female_vector = female_rollno_vectors[femaleRollNo]
    score = search(male_vector, 1, "male", filter_id=femaleRollNo)
    if score:
        return {"score": round(score[0][1], 2)}
    else:
        return {"score": 0.0}   
        
if(__name__ == "__main__"):
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=6969)