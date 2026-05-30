from fastapi import FastAPI
from api.embed import router as embed_router
from api.health import router as health_router

app = FastAPI()

app.include_router(embed_router)
app.include_router(health_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)