import asyncio, os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()
client = AsyncIOMotorClient(os.getenv('MONGO_URL'))
db = client.siest_db

async def run():
    print("\n--- Sample casos_geolocalizados ---")
    print(await db.casos_geolocalizados.find_one())
    
    print("\n--- Sample clima ---")
    print(await db.clima.find_one())

asyncio.run(run())
