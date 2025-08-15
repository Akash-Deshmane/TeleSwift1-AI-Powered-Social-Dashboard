from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi import Query
from telethon.sync import TelegramClient
import os
from dotenv import load_dotenv
from telegram_client import start_auth, verify_code, fetch_user_info
load_dotenv()

API_ID = int(os.getenv("APP_API_ID"))
API_HASH = os.getenv("APP_API_HASH")

router = APIRouter()

class PhoneRequest(BaseModel):
    phone: str


@router.get("/profile/{phone}")
async def get_user_info(phone:str):

    try:
        user_info = await fetch_user_info(phone)
        return user_info
    except Exception as e:
        raise HTTPException(status_code=400,detail=str(e))
    return user_info