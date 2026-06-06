import asyncio
from typing import Optional
from fastapi import APIRouter
from app.database import db
from shapely.geometry import shape, Point

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

# --- CACHE DE POLÍGONOS GEOESPACIAIS ---
_poligonos_vulnerabilidade = None
_poligonos_inundacao = None

async def get_poligonos_vulnerabilidade():
    global _poligonos_vulnerabilidade
    if _poligonos_vulnerabilidade is None:
        docs = await db.vulnerabilidade_habitacional.find().to_list(length=None)
        _poligonos_vulnerabilidade = []
        for doc in docs:
            geom = doc.get("geometry")
            if geom:
                try:
                    poly = shape(geom)
                    nome = doc.get("properties", {}).get("NOME_AREA", "ÁREA DESCONHECIDA")
                    _poligonos_vulnerabilidade.append((poly, nome))
                except: pass
    return _poligonos_vulnerabilidade

async def get_poligonos_inundacao():
    global _poligonos_inundacao
    if _poligonos_inundacao is None:
        docs = await db.risco_inundacao.find().to_list(length=None)
        _poligonos_inundacao = []
        for doc in docs:
            geom = doc.get("geometry")
            if geom:
                try:
                    poly = shape(geom)
                    classe = doc.get("properties", {}).get("CLASSE", "Risco Desconhecido")
                    _poligonos_inundacao.append((poly, classe))
                except: pass
    return _poligonos_inundacao
# ---------------------------------------

AGE_WEIGHTS = {
    "00 a 04": 2, "05 a 09": 7, "10 a 14": 12, "15 a 19": 17,
    "20 a 29": 25, "30 a 39": 35, "40 a 49": 45, "50 a 59": 55,
    "60 a 69": 65, "70 a 79": 75, "80": 85
}

@router.get("/resumo")
async def get_resumo_kpis(doenca: str = None, ano: int = None, sexo: str = None):
    """Retorna os KPIs gerais ou específicos da doença, filtrados por ano e sexo."""
    
    filtro = {"doenca": doenca} if doenca else {}

    resumo_clima = await db.agg_resumo_clima.find_one({}, {"_id": 0}) or {}

    if not doenca and not ano and not sexo:
        resumo_casos = await db.agg_resumo_casos.find_one({}, {"_id": 0})
    elif ano or sexo:
        # Agregação dinâmica para suportar o filtro de ano e sexo
        filtro_raw = {}
        if doenca:
            filtro_raw["NOME_DOENCA"] = doenca
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
    filtro = {"doenca": doenca} if doenca else {}
    if ano:
        filtro["ano"] = ano
    # Sexo is ignored for climate aggregates since climate data applies to all demographics
    
    if granularidade == "semana":
        return await db.agg_casos_clima_por_semana.find(filtro, {"_id": 0}).to_list(length=None)
    else:
        return await db.agg_casos_clima_por_mes.find(filtro, {"_id": 0}).to_list(length=None)

@router.get("/demografia")
async def get_dados_demograficos(doenca: str = None):
    filtro = {"doenca": doenca} if doenca else {}
    
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
    filtro = {"doenca": doenca} if doenca else {}
    dados = await db.agg_casos_por_hospital.find(filtro, {"_id": 0}).to_list(length=None)
    return dados

@router.get("/mapas/casos")
async def get_mapa_casos(doenca: str = None, ano: int = None, sexo: str = None, evolucao: str = None, hospitalizado: str = None):
    filtro = {"doenca": doenca} if doenca else {}
    
    if ano or sexo or evolucao or hospitalizado:
        filtro_raw = {}
        if doenca:
            filtro_raw["NOME_DOENCA"] = doenca
        if sexo:
            filtro_raw["CS_SEXO"] = sexo
        if evolucao:
            filtro_raw["EVOLUCAO"] = evolucao
        if hospitalizado:
            filtro_raw["HOSPITALIZ"] = hospitalizado
        if ano:
            from datetime import datetime
            inicio = datetime(ano, 1, 1)
            fim = datetime(ano, 12, 31, 23, 59, 59)
            filtro_raw["DT_NOTIFIC"] = {"$gte": inicio, "$lte": fim}
            
        pipeline = [
            {"$match": filtro_raw},
            {"$match": {"NO_FANTASIA": {"$exists": True, "$ne": None, "$nin": ["", " ", "IGNORADO"]}}},
            {"$group": {
                "_id": "$NO_FANTASIA",
                "total_casos": {"$sum": 1}
            }},
            {"$lookup": {
                "from": "agg_mapa_casos",
                "localField": "_id",
                "foreignField": "hospital",
                "as": "hospital_info"
            }},
            {"$addFields": {
                "hospital_info": {"$arrayElemAt": ["$hospital_info", 0]}
            }},
            {"$match": {"hospital_info": {"$ne": None}}},
            {"$project": {
                "_id": 0,
                "hospital": "$_id",
                "latitude": "$hospital_info.latitude",
                "longitude": "$hospital_info.longitude",
                "total_casos": 1
            }}
        ]
        # Important: use casos_geolocalizados because it has EVOLUCAO, HOSPITALIZ, etc.
        cursor = await db.casos_geolocalizados.aggregate(pipeline)
        return await cursor.to_list(length=None)

    return await db.agg_mapa_casos.find(filtro, {"_id": 0}).to_list(length=None)

@router.get("/demografia-sazonal")
async def get_demografia_sazonal(doenca: str = None, ano: int = None, sexo: str = None):
    filtro = {}
    if doenca:
        filtro["doenca"] = doenca
    if sexo:
        filtro["sexo"] = sexo
    if ano:
        filtro["ano"] = ano

    pipeline = [
        {"$match": filtro},
        {"$group": {
            "_id": {
                "mes": "$mes",
                "faixa_etaria": "$faixa_etaria"
            },
            "total_casos": {"$sum": "$total_casos"}
        }},
        {"$project": {
            "_id": 0,
            "mes": "$_id.mes",
            "faixa_etaria": "$_id.faixa_etaria",
            "total_casos": 1
        }},
        {"$sort": {"mes": 1, "faixa_etaria": 1}}
    ]

    cursor = await db.agg_cubo_casos.aggregate(pipeline)
    dados = await cursor.to_list(length=None)
    
    # Preencher faixas etárias vazias se necessário
    meses_nomes = {
        1: "Jan", 2: "Fev", 3: "Mar", 4: "Abr", 5: "Mai", 6: "Jun",
        7: "Jul", 8: "Ago", 9: "Set", 10: "Out", 11: "Nov", 12: "Dez"
    }

    # Formatando para uso no heatmap no frontend
    # Queremos uma lista onde cada item tem { name: "Faixa Etária", "Jan": 10, "Fev": 20, ... }
    
    heatmap_dict = {}
    faixas = [
        "00 a 04 anos", "05 a 14 anos", "15 a 29 anos", 
        "30 a 39 anos", "40 a 59 anos", "60 a 79 anos", "80+ anos"
    ]
    
    for f in faixas:
        heatmap_dict[f] = {"faixa_etaria": f}
        for m in range(1, 13):
            heatmap_dict[f][meses_nomes[m]] = 0

    for d in dados:
        f = d.get("faixa_etaria")
        m = d.get("mes")
        c = d.get("total_casos")
        
        # Ignorar faixas que não estão mapeadas exatamente ou None
        if f in heatmap_dict and m in meses_nomes:
            heatmap_dict[f][meses_nomes[m]] += c

    return list(heatmap_dict.values())

@router.get("/piramide-etaria")
async def get_piramide_etaria(doenca: str = None, ano: int = None, filtro_idades: str = None):
    filtro = {}
    if doenca:
        filtro["doenca"] = doenca
    if ano:
        filtro["ano"] = ano
        
    pipeline = [
        {"$match": filtro},
        {"$group": {
            "_id": {
                "idade": "$idade",
                "faixa_etaria": "$faixa_etaria",
                "sexo": "$sexo"
            },
            "total_casos": {"$sum": "$total_casos"}
        }}
    ]
    
    cursor = await db.agg_cubo_casos.aggregate(pipeline)
    dados_raw = await cursor.to_list(length=None)
    
    import re
    
    if filtro_idades and filtro_idades.strip() != "":
        # Process custom age segments
        segments = [s.strip() for s in filtro_idades.split(',') if s.strip()]
        piramide = {s: {"faixa_etaria": s if '-' in s else f"{s} anos", "M": 0, "F": 0} for s in segments}
        
        for d in dados_raw:
            idade_raw = d["_id"].get("idade")
            if idade_raw is None: continue
            idade = int(idade_raw)
            sexo = d["_id"].get("sexo")
            total = d.get("total_casos", 0)
            
            if sexo not in ["M", "F"]: continue
            
            for s in segments:
                if '-' in s:
                    parts = s.split('-')
                    if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
                        start, end = int(parts[0]), int(parts[1])
                        if start <= idade <= end:
                            if sexo == "M": piramide[s]["M"] += total
                            else: piramide[s]["F"] -= total
                else:
                    idade_buscada = int(re.sub(r'\D', '', s)) if re.sub(r'\D', '', s) else -1
                    if idade == idade_buscada:
                        if sexo == "M": piramide[s]["M"] += total
                        else: piramide[s]["F"] -= total
                        
        # Remover segmentos zerados
        return [v for v in piramide.values() if v["M"] > 0 or v["F"] < 0]
    
    # Processar dados para a pirâmide padrão
    faixas = [
        "00 a 04 anos", "05 a 14 anos", "15 a 29 anos", 
        "30 a 39 anos", "40 a 59 anos", "60 a 79 anos", "80+ anos"
    ]
    
    piramide = {f: {"faixa_etaria": f, "M": 0, "F": 0} for f in faixas}
    
    for d in dados_raw:
        faixa = d["_id"].get("faixa_etaria")
        sexo = d["_id"].get("sexo")
        total = d.get("total_casos", 0)
        
        if faixa in piramide and sexo in ["M", "F"]:
            if sexo == "M":
                piramide[faixa]["M"] += total
            else:
                piramide[faixa]["F"] -= total
                
    return list(piramide.values())

@router.get("/vulnerabilidade")
async def get_vulnerabilidade_ranking(doenca: str = None, ano: int = None, sexo: str = None):
    filtro_raw = {}
    if doenca:
        filtro_raw["NOME_DOENCA"] = doenca
    if sexo:
        filtro_raw["doenca"] = doenca
    if sexo:
        filtro_raw["sexo"] = sexo
    if ano:
        filtro_raw["ano"] = ano
        
    pipeline = [
        {"$match": filtro_raw},
        {"$group": {
            "_id": "$hospital",
            "total_casos": {"$sum": "$total_casos"},
            "vulneravel_nome": {"$first": "$vulneravel_nome"},
            "inundacao_classe": {"$first": "$inundacao_classe"}
        }}
    ]
    cursor = await db.agg_vulnerabilidade_casos.aggregate(pipeline)
    casos_agrupados = await cursor.to_list(length=None)
    
    total_casos = sum(c["total_casos"] for c in casos_agrupados)
    
    is_waterborne = doenca in ["HEPA", "LEPTOSPIROSE"]
    
    area_counts = {}
    casos_em_risco = 0
    
    for caso in casos_agrupados:
        count = caso["total_casos"]
        
        if is_waterborne:
            area_name = caso.get("inundacao_classe")
            if area_name and area_name != "Desconhecida":
                casos_em_risco += count
                area_counts[area_name] = area_counts.get(area_name, 0) + count
        else:
            area_name = caso.get("vulneravel_nome")
            if area_name and area_name != "DESCONHECIDO":
                casos_em_risco += count
                area_counts[area_name] = area_counts.get(area_name, 0) + count
                
    sorted_areas = sorted(
        [{"area": k, "total_casos": v} for k, v in area_counts.items()],
        key=lambda x: x["total_casos"],
        reverse=True
    )[:10]

    return {
        "is_waterborne": is_waterborne,
        "total_casos": total_casos,
        "casos_em_risco": casos_em_risco,
        "proporcao_risco": round((casos_em_risco / total_casos * 100) if total_casos > 0 else 0, 1),
        "ranking": sorted_areas
    }

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

@router.get("/unidades-carga")
async def get_unidades_carga(doenca: str = None, ano: int = None, sexo: str = None):
    filtro = {
        "ID_UNIDADE": {"$exists": True, "$ne": ""},
        "NO_FANTASIA": {"$exists": True, "$ne": None, "$nin": ["", " ", "IGNORADO"]}
    }
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
                "id_unidade": "$ID_UNIDADE",
                "no_fantasia": "$NO_FANTASIA"
            },
            "total_casos": {"$sum": 1},
            "internacoes": {
                "$sum": {
                    "$cond": [{"$eq": [{"$toString": "$HOSPITALIZ"}, "1"]}, 1, 0]
                }
            },
            "obitos": {
                "$sum": {
                    "$cond": [{"$in": [{"$toString": "$EVOLUCAO"}, ["2", "3"]]}, 1, 0]
                }
            }
        }},
        {"$project": {
            "id_unidade": "$_id.id_unidade",
            "no_fantasia": "$_id.no_fantasia",
            "total_casos": 1,
            "internacoes": 1,
            "obitos": 1,
            "severidade": {
                "$cond": [
                    {"$eq": ["$total_casos", 0]},
                    0,
                    {"$divide": [{"$add": ["$internacoes", "$obitos"]}, "$total_casos"]}
                ]
            }
        }},
        {"$sort": {"total_casos": -1}},
        {"$limit": 15}
    ]

    cursor = await db.casos_geolocalizados.aggregate(pipeline)
    resultados = await cursor.to_list(length=None)

    # Retornamos uma lista plana para o Bar Chart
    return [
        {
            "id": r["no_fantasia"], # Nivo bar usa 'id' para o eixo
            "casos": r["total_casos"],
            "internacoes": r["internacoes"],
            "obitos": r["obitos"],
            "severidade": r["severidade"]
        }
        for r in resultados
    ]

@router.get("/grafo-sobrecarga")
async def get_grafo_sobrecarga(modo_origem: str = "doenca", doenca: str = None, ano: int = None, sexo: str = None):
    filtro = {
        "NO_FANTASIA": {"$exists": True, "$ne": None, "$nin": ["", " ", "IGNORADO"]}
    }
    if doenca:
        filtro["NOME_DOENCA"] = {"$regex": f"^{doenca}$", "$options": "i"}
    if ano:
        from datetime import datetime
        inicio = datetime(ano, 1, 1)
        fim = datetime(ano, 12, 31, 23, 59, 59)
        filtro["DT_NOTIFIC"] = {"$gte": inicio, "$lte": fim}
    if sexo:
        filtro["CS_SEXO"] = sexo

    if modo_origem == "faixa_etaria":
        origem_expr = {
            "$switch": {
                "branches": [
                    {"case": {"$lt": ["$idade_calc", 5]}, "then": "00 a 04 anos"},
                    {"case": {"$lt": ["$idade_calc", 15]}, "then": "05 a 14 anos"},
                    {"case": {"$lt": ["$idade_calc", 30]}, "then": "15 a 29 anos"},
                    {"case": {"$lt": ["$idade_calc", 40]}, "then": "30 a 39 anos"},
                    {"case": {"$lt": ["$idade_calc", 60]}, "then": "40 a 59 anos"},
                    {"case": {"$lt": ["$idade_calc", 80]}, "then": "60 a 79 anos"}
                ],
                "default": "80+ anos"
            }
        }
        pipeline = [
            {"$match": filtro},
            {"$project": {
                "NO_FANTASIA": 1,
                "idade_calc": {
                    "$cond": [
                        {"$gte": [{"$convert": {"input": "$NU_IDADE_N", "to": "int", "onError": 0, "onNull": 0}}, 4000]},
                        {"$mod": [{"$convert": {"input": "$NU_IDADE_N", "to": "int", "onError": 0, "onNull": 0}}, 1000]},
                        0
                    ]
                }
            }},
            {"$project": {
                "NO_FANTASIA": 1,
                "origem": origem_expr
            }},
            {"$group": {
                "_id": {
                    "origem": "$origem",
                    "destino": "$NO_FANTASIA"
                },
                "peso": {"$sum": 1}
            }}
        ]
    else:
        pipeline = [
            {"$match": filtro},
            {"$group": {
                "_id": {
                    "origem": "$NOME_DOENCA",
                    "destino": "$NO_FANTASIA"
                },
                "peso": {"$sum": 1}
            }}
        ]

    cursor = await db.casos_geolocalizados.aggregate(pipeline)
    resultados = await cursor.to_list(length=None)

    nodes_dict = {}
    links = []

    for r in resultados:
        origem = r["_id"].get("origem", "Desconhecido")
        destino = r["_id"].get("destino", "Desconhecido")
        peso = r.get("peso", 0)

        # Filtra volumes muito pequenos para não sujar o grafo (opcional, setado para 2 para tirar casos super isolados)
        if not origem or not destino or peso < 2:
            continue

        if origem not in nodes_dict:
            nodes_dict[origem] = {"id": origem, "group": "source", "val": 0, "name": origem}
        nodes_dict[origem]["val"] += peso

        if destino not in nodes_dict:
            nodes_dict[destino] = {"id": destino, "group": "target", "val": 0, "name": destino}
        nodes_dict[destino]["val"] += peso

        links.append({
            "source": origem,
            "target": destino,
            "value": peso
        })

    return {
        "nodes": list(nodes_dict.values()),
        "links": links
    }