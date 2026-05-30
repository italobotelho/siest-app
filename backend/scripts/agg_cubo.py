import os
from pymongo import MongoClient
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

MONGO_URL = os.getenv("MONGO_URL")

if not MONGO_URL:
    raise ValueError("⚠️ ERRO: Variável MONGO_URL não encontrada.")

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

pipeline_cubo = [
    {
        "$addFields": {
            "idade_real": {
                "$let": {
                    "vars": {
                        "idade_num": {
                            "$convert": {
                                "input": "$NU_IDADE_N",
                                "to": "double",
                                "onError": None,
                                "onNull": None
                            }
                        }
                    },
                    "in": {
                        "$cond": [
                            {"$eq": ["$$idade_num", None]},
                            None,
                            {"$cond": [
                                {"$gte": ["$$idade_num", 4000]},
                                {"$mod": ["$$idade_num", 1000]},
                                0
                            ]}
                        ]
                    }
                }
            }
        }
    },
    {
        "$addFields": {
            "faixa_etaria": {
                "$switch": {
                    "branches": [
                        {"case": {"$eq": ["$idade_real", None]}, "then": "Não Informado"},
                        {"case": {"$lte": ["$idade_real", 4]}, "then": "00 a 04 anos"},
                        {"case": {"$lte": ["$idade_real", 14]}, "then": "05 a 14 anos"},
                        {"case": {"$lte": ["$idade_real", 29]}, "then": "15 a 29 anos"},
                        {"case": {"$lte": ["$idade_real", 39]}, "then": "30 a 39 anos"},
                        {"case": {"$lte": ["$idade_real", 59]}, "then": "40 a 59 anos"},
                        {"case": {"$lte": ["$idade_real", 79]}, "then": "60 a 79 anos"}
                    ],
                    "default": "80+ anos"
                }
            }
        }
    },
    {
        "$group": {
            "_id": {
                "doenca": "$NOME_DOENCA",
                "ano": {"$year": "$DT_NOTIFIC"},
                "mes": {"$month": "$DT_NOTIFIC"},
                "sexo": "$CS_SEXO",
                "idade": "$idade_real",
                "faixa_etaria": "$faixa_etaria",
                "evolucao": "$EVOLUCAO"
            },
            "total_casos": {"$sum": 1}
        }
    },
    {
        "$project": {
            "_id": 0,
            "doenca": "$_id.doenca",
            "ano": "$_id.ano",
            "mes": "$_id.mes",
            "sexo": "$_id.sexo",
            "idade": "$_id.idade",
            "faixa_etaria": "$_id.faixa_etaria",
            "evolucao": "$_id.evolucao",
            "total_casos": 1
        }
    }
]

salvar_agregacao("casos_geolocalizados", pipeline_cubo, "agg_cubo_casos")

print("CONCLUIDO: Agregação do Cubo OLAP concluída!")
