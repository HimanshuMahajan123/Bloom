import faiss
import numpy as np

DIM = 384  # MiniLM output size
import os
def load_indexes():
    global male_index, female_index
    global male_id_to_user, female_id_to_user
    global male_rollno_vectors, female_rollno_vectors

    # ---------- MALE ----------
    if os.path.exists("male.index"):
        male_index = faiss.read_index("male.index")

    if os.path.exists("male_id_map.npy"):
        male_id_to_user = np.load(
            "male_id_map.npy", allow_pickle=True
        ).item()
    else:
        male_id_to_user = {}

    if os.path.exists("male_rollno_vectors.npy"):
        male_rollno_vectors = np.load(
            "male_rollno_vectors.npy", allow_pickle=True
        ).item()
    else:
        male_rollno_vectors = {}

    # ---------- FEMALE ----------
    if os.path.exists("female.index"):
        female_index = faiss.read_index("female.index")

    if os.path.exists("female_id_map.npy"):
        female_id_to_user = np.load(
            "female_id_map.npy", allow_pickle=True
        ).item()
    else:
        female_id_to_user = {}

    if os.path.exists("female_rollno_vectors.npy"):
        female_rollno_vectors = np.load(
            "female_rollno_vectors.npy", allow_pickle=True
        ).item()
    else:
        female_rollno_vectors = {}

def save_indexes():
    if male_index.ntotal > 0:
        faiss.write_index(male_index, "male.index")
        np.save("male_id_map.npy", male_id_to_user)
        np.save("male_rollno_vectors.npy", male_rollno_vectors)

    if female_index.ntotal > 0:
        faiss.write_index(female_index, "female.index")
        np.save("female_id_map.npy", female_id_to_user)
        np.save("female_rollno_vectors.npy", female_rollno_vectors)

male_index = faiss.IndexFlatIP(DIM)  # cosine similarity
female_index = faiss.IndexFlatIP(DIM)
male_rollno_vectors = {}
female_rollno_vectors = {}
male_id_to_user = {}
female_id_to_user = {}

def add_user_vector(rollno: str, vector: np.ndarray, gender: str):
    gender = gender.upper()
    vector = vector.astype(np.float32)

    if gender == "MALE":
        male_id = male_index.ntotal
        male_index.add(np.array([vector]))
        male_rollno_vectors[rollno] = vector
        male_id_to_user[male_id] = rollno

    elif gender == "FEMALE":
        female_id = female_index.ntotal
        female_index.add(np.array([vector]))
        female_rollno_vectors[rollno] = vector
        female_id_to_user[female_id] = rollno

def search(vector: np.ndarray, k: int, gender: str):
    gender = gender.upper()
    vector = vector.astype(np.float32)

    results = []

    if gender == "MALE":
        D, I = female_index.search(np.array([vector]), k)
        for score, idx in zip(D[0], I[0]):
            if idx != -1:
                results.append((female_id_to_user[idx], float(score)))

    elif gender == "FEMALE":
        D, I = male_index.search(np.array([vector]), k)
        for score, idx in zip(D[0], I[0]):
            if idx != -1:
                results.append((male_id_to_user[idx], float(score)))

    return results
