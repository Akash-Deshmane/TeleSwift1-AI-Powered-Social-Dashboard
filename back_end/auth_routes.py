from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi import Query
from telethon.sync import TelegramClient
import os
from dotenv import load_dotenv
from telegram_client import start_auth, verify_code, fetch_user_info, logout
load_dotenv()

API_ID = int(os.getenv("APP_API_ID"))
API_HASH = os.getenv("APP_API_HASH")

router = APIRouter()

class PhoneRequest(BaseModel):
    phone: str

class VerifyRequest(BaseModel):
    phone: str
    code: str

@router.post("/start")
async def auth_start(data: PhoneRequest):
    try:
        await start_auth(data.phone)
        return {"message": "OTP sent"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify")
async def auth_verify(data: VerifyRequest):
    try:
        await verify_code(data.phone, data.code)
        return {"message": "Login successful"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/check_session")
async def check_session(phone: str = Query(...)):
    session_path = f"sessions/{phone}.session"
    print(f"Checking session for {phone}")
    
    if not os.path.exists(session_path):
        return {"authenticated": False}

    client = TelegramClient(f"sessions/{phone}", API_ID, API_HASH)
    await client.connect()
    is_auth = await client.is_user_authorized()
    await client.disconnect()

    return {"authenticated": is_auth}

@router.post('/logout/{phone}')
async def user_logout(phone:str):
     try:
        await logout(phone)
        return {"message": "Login successful"}
     except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
     
    