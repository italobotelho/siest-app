import asyncio
from fastapi import APIRouter
from app.database import db

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

AGE_WEIGHTS = {
    "00 a 04": 2, "05 a 09": 7, "10 a 14": 12, "15 a 19": 17,
    "20 a 29": 25, "30 a 39": 35, "40 a 49": 45, "50 a 59": 55,
    "60 a 69": 65, "70 a 79": 75, "80": 85
}

@router.get("/resumo")
async def get_resumo_kpis(doenca: str = None):
    """Retorna os KPIs gerais ou específicos da doença."""
    
    filtro = {"doenca": {"$regex": f"^{doenca}$", "$options": "i"}} if doenca else {}

    resumo_clima = await db.agg_resumo_clima.find_one({}, {"_id": 0}) or {}

    if not doenca:
        resumo_casos = await db.agg_resumo_casos.find_one({}, {"_id": 0})
    else:
        # Executa as 3 consultas no banco simultaneamente em vez de uma por vez
        dados_temporais, dados_hospitais, dados_idade = await asyncio.gather(
            db.agg_casos_clima_por_mes.find(filtro, {"_id": 0}).to_list(length=None),
            db.agg_casos_por_hospital.find(filtro, {"_id": 0}).to_list(length=None),
            db.agg_casos_por_faixa_etaria.find(filtro, {"_id": 0}).to_list(length=None)
        )
        
        total_casos_doenca = sum(item.get("total_casos", 0) for item in dados_temporais)
        
        # Hospitalizações e Unidades
        total_hospitalizados = sum(h.get("hospitalizacoes", 0) for h in dados_hospitais)
        total_unidades = sum(1 for h in dados_hospitais if h.get("total_casos", 0) > 0)
        
        # Média de Idade (aproximada por faixa etária)
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
        
        # Temperatura Média ponderada pelos meses de incidência
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
async def get_dados_temporais(doenca: str = None, granularidade: str = "mes"):
    filtro = {"doenca": {"$regex": f"^{doenca}$", "$options": "i"}} if doenca else {}
    
    if granularidade == "semana":
        return await db.agg_casos_clima_por_semana.find(filtro, {"_id": 0}).to_list(length=None)
    else:
        return await db.agg_casos_clima_por_mes.find(filtro, {"_id": 0}).to_list(length=None)

@router.get("/demografia")
async def get_dados_demograficos(doenca: str = None):
    filtro = {"doenca": {"$regex": f"^{doenca}$", "$options": "i"}} if doenca else {}
    
    # Executa as 3 consultas no banco simultaneamente
    faixa_etaria, sexo, letalidade = await asyncio.gather(
        db.agg_casos_por_faixa_etaria.find(filtro, {"_id": 0}).to_list(length=None),
        db.agg_casos_por_sexo.find(filtro, {"_id": 0}).to_list(length=None),
        db.agg_letalidade_doenca.find(filtro, {"_id": 0}).to_list(length=None)
    )
    
    return {
        "faixa_etaria": faixa_etaria,
        "sexo": sexo,
        "letalidade": letalidade
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
async def get_mapa_casos(doenca: str = None):
    filtro = {"doenca": {"$regex": f"^{doenca}$", "$options": "i"}} if doenca else {}
    dados = await db.agg_mapa_casos.find(filtro, {"_id": 0}).to_list(length=None)
    return dados