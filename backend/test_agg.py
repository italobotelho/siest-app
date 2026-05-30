import asyncio
from app.database import db
import time

async def run():
    start = time.time()
    
    filtro = {"NOME_DOENCA": "DENGUE"}
    
    pipeline = [
        {"$match": filtro},
        {"$group": {
            "_id": None,
            "total_casos": {"$sum": 1},
            "hospitalizacoes": {
                "$sum": {"$cond": [{"$eq": ["$HOSPITALIZ", "1"]}, 1, 0]}
            }
        }}
    ]
    
    res = await db.casos_geolocalizados.aggregate(pipeline).to_list(length=1)
    
    end = time.time()
    print(f"Time taken: {end - start:.2f} seconds")
    print(res)

asyncio.run(run())
