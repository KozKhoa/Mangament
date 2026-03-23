from models.model import model
from sentence_transformers import util
import torch

def get_embedding(text: str):
    return model.encode(text).tolist()

def get_similarities(target_embedding: list[float], candidate_embeddings: list[list[float]]):
    target = torch.tensor([target_embedding])
    candidates = torch.tensor(candidate_embeddings)
    cos_sim = util.cos_sim(target, candidates)
    # cos_sim returns a tensor, we want a flat list of floats
    return cos_sim.flatten().tolist()