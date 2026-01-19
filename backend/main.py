from fastapi import FastAPI
from .routers import api

app = FastAPI(title="UpPass Verify Service")

@app.get("/")
def read_root():
    return {"message": "UpPass Secure Bridge Backend Running (Modular)"}

# Include Routers
app.include_router(api.router)
