import asyncio
import os
import sys

# Force stdout to be utf-8 to avoid charmap errors
sys.stdout.reconfigure(encoding='utf-8')

from app.database import db

async def check_humidity():
    agg_doc = await db.agg_casos_clima_por_mes.find_one()
    print('Sample agg_casos_clima_por_mes keys:', list(agg_doc.keys()) if agg_doc else None)
    
    clima_doc = await db.clima_campinas.find_one()
    if clima_doc:
        print('Sample clima_campinas keys:', list(clima_doc.keys()))
        
asyncio.run(check_humidity())
