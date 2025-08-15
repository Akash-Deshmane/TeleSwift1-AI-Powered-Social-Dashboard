from fastapi import FastAPI
from auth_routes import router as auth_router
from main_routes import router as main_router

app = FastAPI()
app.include_router(auth_router, prefix="/auth")
app.include_router(main_router, prefix="/teleswift")
