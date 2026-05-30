import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Carrega as variáveis de ambiente
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

MONGO_URL = os.getenv("MONGO_URL")

if not MONGO_URL:
    raise ValueError("⚠️ ERRO: Variável MONGO_URL não encontrada. Certifique-se de que o .env está configurado na raiz do backend.")

print("Conectando ao MongoDB...")
client = MongoClient(MONGO_URL)
db = client.siest_db

def salvar_agregacao(nome_colecao_origem, pipeline, nome_colecao_destino):
    print(f"Executando agregação para {nome_colecao_destino}...")
    resultado = list(db[nome_colecao_origem].aggregate(pipeline))
    
    db[nome_colecao_destino].delete_many({})
    
    if resultado:
        db[nome_colecao_destino].insert_many(resultado)
        
    print(f"SUCESSO: {nome_colecao_destino}: {len(resultado)} documentos salvos.\n")

print("--------------------------------------------------")

# 1. Agregação Clima por Semana
pipeline_clima_por_semana = [
    {
        "$group": {
            "_id": {
                "ano": {"$isoWeekYear": "$DT_MEDICAO"},
                "semana": {"$isoWeek": "$DT_MEDICAO"}
            },
            "precipitacao_total": {"$sum": "$PRECIP_TOTAL"},
            "temperatura_media": {"$avg": "$TEMP_MED"},
            "umidade_media": {"$avg": "$UMIDADE_MED"},
            "temperatura_maxima": {"$max": "$TEMP_MAX"}
        }
    },
    {"$sort": {"_id.ano": 1, "_id.semana": 1}},
    {
        "$project": {
            "_id": 0,
            "ano": "$_id.ano",
            "semana": "$_id.semana",
            "precipitacao_total": {"$round": ["$precipitacao_total", 2]},
            "temperatura_media": {"$round": ["$temperatura_media", 2]},
            "umidade_media": {"$round": ["$umidade_media", 2]},
            "temperatura_maxima": {"$round": ["$temperatura_maxima", 2]}
        }
    }
]

salvar_agregacao("clima", pipeline_clima_por_semana, "agg_clima_por_semana")

# 2. Agregação Casos + Clima por Semana
pipeline_casos_clima_semana = [
    {
        "$group": {
            "_id": {
                "ano": {"$isoWeekYear": "$DT_NOTIFIC"},
                "semana": {"$isoWeek": "$DT_NOTIFIC"},
                "doenca": "$NOME_DOENCA"
            },
            "total_casos": {"$sum": 1}
        }
    },
    {
        "$lookup": {
            "from": "agg_clima_por_semana",
            "let": {"ano_caso": "$_id.ano", "semana_caso": "$_id.semana"},
            "pipeline": [
                {
                    "$match": {
                        "$expr": {
                            "$and": [{"$eq": ["$ano", "$$ano_caso"]}, {"$eq": ["$semana", "$$semana_caso"]}]
                        }
                    }
                }
            ],
            "as": "clima"
        }
    },
    # Mantém a semana mesmo que não tenha dados climáticos (opcional, left join)
    {"$unwind": {"path": "$clima", "preserveNullAndEmptyArrays": True}},
    {
        "$project": {
            "_id": 0, 
            "ano": "$_id.ano", 
            "semana": "$_id.semana", 
            "doenca": "$_id.doenca", 
            "total_casos": 1,
            "precipitacao_total": {"$ifNull": ["$clima.precipitacao_total", 0]},
            "temperatura_media": {"$ifNull": ["$clima.temperatura_media", 0]},
            "temperatura_maxima": {"$ifNull": ["$clima.temperatura_maxima", 0]},
            "umidade_media": {"$ifNull": ["$clima.umidade_media", 0]}
        }
    },
    {"$sort": {"ano": 1, "semana": 1}}
]

salvar_agregacao("casos_geolocalizados", pipeline_casos_clima_semana, "agg_casos_clima_por_semana")

print("CONCLUIDO: Todas as agregacoes semanais foram concluidas com sucesso!")
