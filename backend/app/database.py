from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Carrega as variáveis escondidas do ficheiro .env
load_dotenv()

# Puxa a variável sem expor a senha no ficheiro
MONGO_URL = os.getenv("MONGO_URL")

if not MONGO_URL:
    raise ValueError("⚠️ ERRO: Variável MONGO_URL não encontrada. Crie o ficheiro .env!")

client = AsyncIOMotorClient(MONGO_URL)
db = client.siest_db

print("🔌 Cliente MongoDB (Motor) inicializado com segurança.")