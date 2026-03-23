from pydantic import BaseModel

class EmbedRequest(BaseModel):
    text: str

class StoryEmbedRequest(BaseModel):
    title: str
    summary: str
    genres: list[str]

class EmbedResponse(BaseModel):
    embedding: list[float]

class SimilarityRequest(BaseModel):
    target_embedding: list[float]
    candidate_embeddings: list[list[float]]

class SimilarityResponse(BaseModel):
    similarities: list[float]