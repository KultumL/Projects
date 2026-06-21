# rag.py — chunking, local embeddings, retrieval (framework-agnostic now)
from functools import lru_cache
import numpy as np
from sentence_transformers import SentenceTransformer


# load the model exactly once (lru_cache holds the single instance)
@lru_cache(maxsize=1)
def load_embedder():
    return SentenceTransformer("all-MiniLM-L6-v2")


def cosine(a, b):
    a, b = np.array(a), np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


# cache each company's chunk index by ticker, so a filing is embedded only once
_index_cache = {}

def build_chunk_index(ticker, filing_text):
    if ticker in _index_cache:
        return _index_cache[ticker]

    chunk_size, overlap = 2000, 200
    chunks, start = [], 0
    while start < len(filing_text):
        end = start + chunk_size
        chunks.append(filing_text[start:end])
        start = end - overlap

    vectors = load_embedder().encode(chunks)
    _index_cache[ticker] = (chunks, vectors)
    return chunks, vectors


def retrieve_chunks(query, chunks, chunk_vecs, top_k=5):
    query_vec = load_embedder().encode([query])[0]
    scored = []
    for chunk, vec in zip(chunks, chunk_vecs):
        scored.append((cosine(query_vec, vec), chunk))
    scored.sort(reverse=True)
    top = [chunk for score, chunk in scored[:top_k]]
    return "\n\n---\n\n".join(top)