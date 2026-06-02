from fastapi import APIRouter
from schemas.embed import EmbedRequest, SimilarityRequest, StoryEmbedRequest
from services.embedding import get_embedding, get_similarities

router = APIRouter()

@router.post("/embed")
def embed(req: EmbedRequest):
    return {"embedding": get_embedding(req.text)}

@router.post("/similarity")
def similarity(req: SimilarityRequest):
    return {"similarities": get_similarities(req.target_embedding, req.candidate_embeddings)}

@router.post("/embed-story")
def embed_story(req: StoryEmbedRequest):
    # Combine fields into a single string for better semantic representation
    text = f"Title: {req.title}. Summary: {req.summary}. Genres: {', '.join(req.genres)}."
    return {"embedding": get_embedding(text)}