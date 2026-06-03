import asyncio
from typing import Optional
from fastapi import APIRouter
from app.database import db

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

AGE_WEIGHTS = {
    "00 a 04": 2, "05 a 09": 7, "10 a 14": 12, "15 a 19": 17,
    "20 a 29": 25, "30 a 39": 35, "40 a 49": 45, "50 a 59": 55,
    "60 a 69": 65, "70 a 79": 75, "80": 85
}

@router.get("/resumo")
async def get_resumo_kpis(doenca: str = None, ano: int = None, sexo: str = None):
    """Retorna os KPIs gerais ou específicos da doença, filtrados por ano e sexo."""
    
    filtro = {"doenca": {"$regex": f"^{doenca}$", "$options": "i"}} if doenca else {}

    resumo_clima = await db.agg_resumo_clima.find_one({}, {"_id": 0}) or {}

    if not doenca and not ano and not sexo:
        resumo_casos = await db.agg_resumo_casos.find_one({}, {"_id": 0})
    elif ano or sexo:
        # Agregação dinâmica para suportar o filtro de ano e sexo
        filtro_raw = {}
        if doenca:
            filtro_raw["NOME_DOENCA"] = {"$regex": f"^{doenca}$", "$options": "i"}
        if sexo:
            filtro_raw["CS_SEXO"] = sexo
        if ano:
            from datetime import datetime
            inicio = datetime(ano, 1, 1)
            fim = datetime(ano, 12, 31, 23, 59, 59)
            filtro_raw["DT_NOTIFIC"] = {"$gte": inicio, "$lte": fim}
        pipeline = [
            {"$match": filtro_raw}
        ]
        
        pipeline.append(
            {"$group": {
                "_id": None,
                "total_casos": {"$sum": 1},
                "hospitalizacoes": {
                    "$sum": {"$cond": [{"$eq": ["$HOSPITALIZ", "1"]}, 1, 0]}
                },
                "soma_idade": {
                    "$sum": {
                        "$let": {
                            "vars": {
                                "idade_num": {"$convert": {"input": "$NU_IDADE_N", "to": "int", "onError": 0, "onNull": 0}}
                            },
                            "in": {
                                "$cond": [
                                    {"$gte": ["$$idade_num", 4000]},
                                    {"$mod": ["$$idade_num", 1000]},
                                    0
                                ]
                            }
                        }
                    }
                }
            }}
        )
        
        cursor = await db.casos_geolocalizados.aggregate(pipeline)
        raw_res = await cursor.to_list(length=1)
        if raw_res:
            total_casos_doenca = raw_res[0].get("total_casos", 0)
            total_hospitalizados = raw_res[0].get("hospitalizacoes", 0)
            media_idade = round(raw_res[0].get("soma_idade", 0) / total_casos_doenca, 1) if total_casos_doenca > 0 else "N/A"
        else:
            total_casos_doenca = total_hospitalizados = 0
            media_idade = "N/A"
            
        # Calcular temperatura média dinâmica para o ano
        filtro_clima = filtro.copy()
        if ano:
            filtro_clima["ano"] = ano
            
        dados_temporais = await db.agg_casos_clima_por_mes.find(filtro_clima, {"_id": 0}).to_list(length=None)
        soma_temp = sum(item.get("temperatura_media", 0) * item.get("total_casos", 0) for item in dados_temporais)
        casos_clima = sum(item.get("total_casos", 0) for item in dados_temporais)
        
        if casos_clima > 0 and any("temperatura_media" in i for i in dados_temporais):
            resumo_clima = dict(resumo_clima)
            resumo_clima["media_temperatura"] = round(soma_temp / casos_clima, 1)
        elif ano:
            resumo_clima = dict(resumo_clima)
            resumo_clima["media_temperatura"] = "N/A"

        resumo_casos = {
            "total_casos": total_casos_doenca,
            "media_idade": media_idade,
            "total_hospitalizados": total_hospitalizados,
            "total_unidades": "N/A" # Dinâmico não suporta contagem distinta de unidades facilmente
        }
    else:
        # Modo rápido: apenas doença (usa as coleções pré-agregadas)
        dados_temporais, dados_hospitais, dados_idade = await asyncio.gather(
            db.agg_casos_clima_por_mes.find(filtro, {"_id": 0}).to_list(length=None),
            db.agg_casos_por_hospital.find(filtro, {"_id": 0}).to_list(length=None),
            db.agg_casos_por_faixa_etaria.find(filtro, {"_id": 0}).to_list(length=None)
        )
        
        total_casos_doenca = sum(item.get("total_casos", 0) for item in dados_temporais)
        total_hospitalizados = sum(h.get("hospitalizacoes", 0) for h in dados_hospitais)
        total_unidades = sum(1 for h in dados_hospitais if h.get("total_casos", 0) > 0)
        
        soma_idade = 0
        total_pessoas = 0
        for item in dados_idade:
            faixa = item.get("faixa_etaria", "")
            casos = item.get("total_casos", 0)
            peso = next((w for k, w in AGE_WEIGHTS.items() if k in faixa), None)
            if peso:
                soma_idade += peso * casos
                total_pessoas += casos
                
        media_idade = round(soma_idade / total_pessoas, 1) if total_pessoas > 0 else "N/A"
        
        soma_temp = sum(item.get("temperatura_media", 0) * item.get("total_casos", 0) for item in dados_temporais)
        if total_casos_doenca > 0 and any("temperatura_media" in i for i in dados_temporais):
            resumo_clima = dict(resumo_clima)
            resumo_clima["media_temperatura"] = round(soma_temp / total_casos_doenca, 1)

        resumo_casos = {
            "total_casos": total_casos_doenca,
            "media_idade": media_idade,
            "total_hospitalizados": total_hospitalizados,
            "total_unidades": total_unidades
        }

    return {
        "casos": resumo_casos,
        "clima": resumo_clima
    }

@router.get("/temporal")
async def get_dados_temporais(doenca: str = None, granularidade: str = "mes", ano: int = None, sexo: str = None):
    filtro = {"doenca": {"$regex": f"^{doenca}$", "$options": "i"}} if doenca else {}
    if ano:
        filtro["ano"] = ano
    # Sexo is ignored for climate aggregates since climate data applies to all demographics
    
    if granularidade == "semana":
        return await db.agg_casos_clima_por_semana.find(filtro, {"_id": 0}).to_list(length=None)
    else:
        return await db.agg_casos_clima_por_mes.find(filtro, {"_id": 0}).to_list(length=None)

@router.get("/demografia")
async def get_dados_demograficos(doenca: str = None):
    filtro = {"doenca": {"$regex": f"^{doenca}$", "$options": "i"}} if doenca else {}
    
    # Executa as 4 consultas no banco simultaneamente
    faixa_etaria, sexo, letalidade, idade_exata = await asyncio.gather(
        db.agg_casos_por_faixa_etaria.find(filtro, {"_id": 0}).to_list(length=None),
        db.agg_casos_por_sexo.find(filtro, {"_id": 0}).to_list(length=None),
        db.agg_letalidade_doenca.find(filtro, {"_id": 0}).to_list(length=None),
        db.agg_casos_por_idade.find(filtro, {"_id": 0}).to_list(length=None)
    )
    
    return {
        "faixa_etaria": faixa_etaria,
        "sexo": sexo,
        "letalidade": letalidade,
        "idade_exata": idade_exata
    }

@router.get("/mapas/risco")
async def get_mapa_risco():
    features = await db.risco_inundacao.find({}, {"_id": 0}).to_list(length=None)
    return {"type": "FeatureCollection", "features": features}

@router.get("/mapas/vulnerabilidade")
async def get_mapa_vulnerabilidade():
    features = await db.vulnerabilidade_habitacional.find({}, {"_id": 0}).to_list(length=None)
    return {"type": "FeatureCollection", "features": features}

@router.get("/hospitais")
async def get_hospitais(doenca: str = None):
    filtro = {"doenca": {"$regex": f"^{doenca}$", "$options": "i"}} if doenca else {}
    dados = await db.agg_casos_por_hospital.find(filtro, {"_id": 0}).to_list(length=None)
    return dados

@router.get("/mapas/casos")
async def get_mapa_casos(doenca: str = None, ano: int = None, sexo: str = None):
    filtro = {"doenca": {"$regex": f"^{doenca}$", "$options": "i"}} if doenca else {}
    
    if ano or sexo:
        filtro_raw = {}
        if doenca:
            filtro_raw["NOME_DOENCA"] = {"$regex": f"^{doenca}$", "$options": "i"}
        if sexo:
            filtro_raw["CS_SEXO"] = sexo
        if ano:
            from datetime import datetime
            inicio = datetime(ano, 1, 1)
            fim = datetime(ano, 12, 31, 23, 59, 59)
            filtro_raw["DT_NOTIFIC"] = {"$gte": inicio, "$lte": fim}
            
        pipeline = [
            {"$match": filtro_raw},
            {"$match": {"LATITUDE": {"$type": "double"}, "LONGITUDE": {"$type": "double"}}},
            {"$group": {
                "_id": {"lat": "$LATITUDE", "lon": "$LONGITUDE", "hospital": "$NO_FANTASIA"},
                "total_casos": {"$sum": 1}
            }},
            {"$project": {
                "_id": 0,
                "latitude": "$_id.lat",
                "longitude": "$_id.lon",
                "hospital": {"$ifNull": ["$_id.hospital", "Local Desconhecido"]},
                "total_casos": 1
            }}
        ]
        cursor = await db.casos_geolocalizados.aggregate(pipeline)
        return await cursor.to_list(length=None)
    else:
        return await db.agg_mapa_casos.find(filtro, {"_id": 0}).to_list(length=None)

@router.get("/dinamico")
async def get_dados_dinamicos(
    doenca: Optional[str] = None, 
    ano: Optional[int] = None, 
    sexo: Optional[str] = None
):
    filtro = {}
    if doenca:
        filtro["doenca"] = {"$regex": f"^{doenca}$", "$options": "i"}
    if ano:
        filtro["ano"] = ano
    if sexo:
        filtro["sexo"] = {"$regex": f"^{sexo}$", "$options": "i"}
        
    pipeline = [
        {"$match": filtro},
        {"$facet": {
            "faixa_etaria": [
                {"$group": {"_id": "$faixa_etaria", "total_casos": {"$sum": "$total_casos"}}},
                {"$project": {"_id": 0, "faixa_etaria": "$_id", "total_casos": 1}},
                {"$sort": {"faixa_etaria": 1}}
            ],
            "idade_exata": [
                {"$group": {"_id": "$idade", "total_casos": {"$sum": "$total_casos"}}},
                {"$project": {"_id": 0, "idade": "$_id", "total_casos": 1}},
                {"$sort": {"idade": 1}}
            ],
            "sexo": [
                {"$group": {"_id": "$sexo", "total_casos": {"$sum": "$total_casos"}}},
                {"$project": {"_id": 0, "sexo": "$_id", "total_casos": 1}}
            ],
            "letalidade": [
                {"$group": {"_id": "$evolucao", "total_casos": {"$sum": "$total_casos"}}},
                {"$project": {"_id": 0, "evolucao": "$_id", "total_casos": 1}}
            ],
            "tempo": [
                {"$group": {
                    "_id": {"ano": "$ano", "mes": "$mes"},
                    "total_casos": {"$sum": "$total_casos"}
                }},
                {"$project": {
                    "_id": 0,
                    "ano": "$_id.ano",
                    "mes": "$_id.mes",
                    "total_casos": 1
                }},
                {"$sort": {"ano": 1, "mes": 1}}
            ]
        }}
    ]
    
    cursor = await db.agg_cubo_casos.aggregate(pipeline)
    resultados = await cursor.to_list(length=1)
    if not resultados:
        return {"faixa_etaria": [], "idade_exata": [], "sexo": [], "letalidade": [], "tempo": []}
    return resultados[0]

@router.get("/anos")
async def get_anos_disponiveis():
    """Retorna uma lista de anos únicos com registros."""
    try:
        anos = await db.agg_casos_clima_por_mes.distinct("ano")
        return sorted([a for a in anos if a is not None], reverse=True)
    except Exception:
        return []

@router.get("/desfechos")
async def get_desfechos_sankey(doenca: str = None, ano: int = None, sexo: str = None):
    filtro = {}
    if doenca:
        filtro["NOME_DOENCA"] = {"$regex": f"^{doenca}$", "$options": "i"}
    if ano:
        from datetime import datetime
        inicio = datetime(ano, 1, 1)
        fim = datetime(ano, 12, 31, 23, 59, 59)
        filtro["DT_NOTIFIC"] = {"$gte": inicio, "$lte": fim}
    if sexo:
        filtro["CS_SEXO"] = sexo
        
    pipeline = [
        {"$match": filtro},
        {"$group": {
            "_id": {
                "classificacao": "$CLASSI_FIN",
                "hospitalizacao": "$HOSPITALIZ",
                "evolucao": "$EVOLUCAO"
            },
            "total": {"$sum": 1}
        }}
    ]
    cursor = await db.casos_geolocalizados.aggregate(pipeline)
    resultados = await cursor.to_list(length=None)
    
    return [
        {
            "classificacao": r["_id"].get("classificacao"),
            "hospitalizacao": r["_id"].get("hospitalizacao"),
            "evolucao": r["_id"].get("evolucao"),
            "total": r["total"]
        }
        for r in resultados
    ]

@router.get("/tempo-resposta")
async def get_tempo_resposta(doenca: str = None, ano: int = None, sexo: str = None):
    filtro = {
        "DT_NOTIFIC": {"$type": "date"},
        "DT_SIN_PRI": {"$type": "date"}
    }
    if doenca:
        filtro["NOME_DOENCA"] = {"$regex": f"^{doenca}$", "$options": "i"}
    if ano:
        from datetime import datetime
        inicio = datetime(ano, 1, 1)
        fim = datetime(ano, 12, 31, 23, 59, 59)
        filtro["DT_NOTIFIC"]["$gte"] = inicio
        filtro["DT_NOTIFIC"]["$lte"] = fim
    if sexo:
        filtro["CS_SEXO"] = sexo

    pipeline = [
        {"$match": filtro},
        {"$project": {
            "CRITERIO": 1,
            "dias_atraso": {
                "$dateDiff": {
                    "startDate": "$DT_SIN_PRI",
                    "endDate": "$DT_NOTIFIC",
                    "unit": "day"
                }
            }
        }},
        {"$match": {"dias_atraso": {"$gte": 0}}},
        {"$project": {
            "criterio": "$CRITERIO",
            "bucket": {
                "$switch": {
                    "branches": [
                        {"case": {"$lte": ["$dias_atraso", 2]}, "then": "0-2 dias (Rápido)"},
                        {"case": {"$lte": ["$dias_atraso", 7]}, "then": "3-7 dias (Alerta)"},
                        {"case": {"$lte": ["$dias_atraso", 14]}, "then": "8-14 dias (Atraso)"}
                    ],
                    "default": "> 14 dias (Crítico)"
                }
            }
        }},
        {"$group": {
            "_id": {
                "criterio": "$criterio",
                "bucket": "$bucket"
            },
            "total": {"$sum": 1}
        }}
    ]

    cursor = await db.casos_geolocalizados.aggregate(pipeline)
    resultados = await cursor.to_list(length=None)

    return [
        {
            "criterio": r["_id"].get("criterio"),
            "bucket": r["_id"].get("bucket"),
            "total": r["total"]
        }
        for r in resultados
    ]