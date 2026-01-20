from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import api

app = FastAPI(title="UpPass Verify Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "UpPass Secure Bridge Backend Running (Modular)"}

# Include Routers
app.include_router(api.router)
