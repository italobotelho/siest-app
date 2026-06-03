import asyncio, os
from pymongo import AsyncMongoClient
from dotenv import load_dotenv

load_dotenv()
client = AsyncMongoClient(os.getenv('MONGO_URL'))
db = client.siest_db

async def run():
    zika_total = await db.casos_geolocalizados.count_documents({'NOME_DOENCA': 'ZIKA'})
    zika_imputed = await db.casos_geolocalizados.count_documents({'NOME_DOENCA': 'ZIKA', 'LATITUDE': -22.9099, 'LONGITUDE': -47.0626})
    
    hepa_total = await db.casos_geolocalizados.count_documents({'NOME_DOENCA': 'HEPA'})
    hepa_imputed = await db.casos_geolocalizados.count_documents({'NOME_DOENCA': 'HEPA', 'LATITUDE': -22.9099, 'LONGITUDE': -47.0626})
    
    print(f"Zika: {zika_imputed}/{zika_total} ({(zika_imputed/zika_total)*100 if zika_total else 0:.2f}%)")
    print(f"Hepa: {hepa_imputed}/{hepa_total} ({(hepa_imputed/hepa_total)*100 if hepa_total else 0:.2f}%)")

asyncio.run(run())
