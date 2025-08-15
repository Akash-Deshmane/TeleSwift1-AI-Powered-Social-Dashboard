from io import BytesIO
import os
from dotenv import load_dotenv
from telethon.sync import TelegramClient
from telethon.sessions import StringSession
from telethon.tl.functions.users import GetFullUserRequest

load_dotenv()

API_ID = int(os.getenv("APP_API_ID"))
API_HASH = os.getenv("APP_API_HASH")

clients = {}

async def start_auth(phone):
    client = TelegramClient(f"sessions/{phone}", API_ID, API_HASH)
    await client.connect()
    await client.send_code_request(phone)
    clients[phone] = client

async def verify_code(phone, code):
    client = clients.get(phone)
    if not client:
        raise ValueError("No client found for this phone")

    await client.sign_in(phone, code)

    # Save session
    await client.disconnect()


async def fetch_user_info(phone):
    session_path = f"sessions/{phone}.session"

    if not os.path.exists(session_path):
        raise ValueError("Session not found")
    
    client = TelegramClient(session_path, API_ID, API_HASH)
    await client.connect()

    if not await client.is_user_authorized():
        await client.disconnect()
        raise ValueError("Session expired or unauthorized.")
    
    me = await client.get_me()
    full = await client(GetFullUserRequest(me.id))
    photo_bytes = await client.download_profile_photo(me, file=BytesIO())
    import base64
    photo_base64 = base64.b64encode(photo_bytes.getvalue()).decode('utf-8')
    
    await client.disconnect()

    return {
        "id": me.id,
        "username": me.username,
        "phone": me.phone,
        "first_name": me.first_name,
        "last_name": me.last_name,
        "photo":photo_base64,
        # "bio": full.about,
    }

async def logout(phone):
    session_path = f"sessions/{phone}.session"

    if not os.path.exists(session_path):
        raise ValueError("Session not found")
    
    client = TelegramClient(session_path, API_ID, API_HASH)
    await client.connect()

    if not await client.is_user_authorized():
        raise ValueError("User is not logged in")

    await client.log_out()
    await client.disconnect()





