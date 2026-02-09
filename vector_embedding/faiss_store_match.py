import faiss
import numpy as np
import os
import threading

DIM = 384
index_lock = threading.Lock()

male_rollno_vectors = {}
female_rollno_vectors = {}

male_index = faiss.IndexFlatIP(DIM)
female_index = faiss.IndexFlatIP(DIM)

male_id_to_user = {}
female_id_to_user = {}

# ---------- REBUILD ----------
def rebuild_male_index():
    global male_index, male_id_to_user
    male_index = faiss.IndexFlatIP(DIM)
    male_id_to_user = {}

    for rollno, vec in male_rollno_vectors.items():
        idx = male_index.ntotal
        male_index.add(np.array([vec], dtype=np.float32))
        male_id_to_user[idx] = rollno


def rebuild_female_index():
    global female_index, female_id_to_user
    female_index = faiss.IndexFlatIP(DIM)
    female_id_to_user = {}

    for rollno, vec in female_rollno_vectors.items():
        idx = female_index.ntotal
        female_index.add(np.array([vec], dtype=np.float32))
        female_id_to_user[idx] = rollno

# ---------- REMOVE USER (MEMORY ONLY) ----------
def remove_user_vector(rollno: str):
    if rollno in male_rollno_vectors:
        del male_rollno_vectors[rollno]

    if rollno in female_rollno_vectors:
        del female_rollno_vectors[rollno]

    rebuild_male_index()
    rebuild_female_index()

# ---------- REMOVE USER (DISK) ----------
def remove_user_from_disk(rollno: str):
    changed = False

    if os.path.exists("male_rollno_vectors.npy"):
        males = np.load("male_rollno_vectors.npy", allow_pickle=True).item()
        if rollno in males:
            del males[rollno]
            np.save("male_rollno_vectors.npy", males)
            changed = True

    if os.path.exists("female_rollno_vectors.npy"):
        females = np.load("female_rollno_vectors.npy", allow_pickle=True).item()
        if rollno in females:
            del females[rollno]
            np.save("female_rollno_vectors.npy", females)
            changed = True

    if changed:
        load_indexes()

# ---------- LOAD ----------
def load_indexes():
    global male_rollno_vectors, female_rollno_vectors

    male_rollno_vectors = (
        np.load("male_rollno_vectors.npy", allow_pickle=True).item()
        if os.path.exists("male_rollno_vectors.npy")
        else {}
    )

    female_rollno_vectors = (
        np.load("female_rollno_vectors.npy", allow_pickle=True).item()
        if os.path.exists("female_rollno_vectors.npy")
        else {}
    )

    rebuild_male_index()
    rebuild_female_index()

# ---------- SAVE ----------
def save_indexes():
    np.save("male_rollno_vectors.npy", male_rollno_vectors)
    np.save("female_rollno_vectors.npy", female_rollno_vectors)

# ---------- ADD ----------
def add_user_vector(rollno: str, vector: np.ndarray, gender: str):
    gender = gender.upper()
    vector = vector.astype(np.float32)

    if gender == "MALE":
        male_rollno_vectors[rollno] = vector
        rebuild_male_index()

    elif gender == "FEMALE":
        female_rollno_vectors[rollno] = vector
        rebuild_female_index()

# ---------- SEARCH ----------
def search(vector: np.ndarray, k: int, gender: str):
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
