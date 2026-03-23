from fastapi import FastAPI
from api.embed import router as embed_router

app = FastAPI()
app.include_router(embed_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)