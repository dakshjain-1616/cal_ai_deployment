from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db import engine, Base
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NeoCal AI Backend",
    description="Calorie tracking API with AI meal recognition",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import auth, users, meals
from routers import water, exercise, weight

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(meals.router)
app.include_router(water.router)
app.include_router(exercise.router)
app.include_router(weight.router)

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)