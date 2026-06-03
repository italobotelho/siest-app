"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, LayersControl, LayerGroup, CircleMarker, Tooltip } from 'react-leaflet';
import api from '@/app/services/api';

// Coordenadas centrais de Campinas
const CENTRO_CAMPINAS: [number, number] = [-22.9056, -47.0608];

export default function MapComponent({ 
  doenca,
  filtroAno = null,
  filtroSexo = null,
  filtroEvolucao = null,
  filtroHospitalizado = null
}: { 
  doenca?: string;
  filtroAno?: number | null;
  filtroSexo?: string | null;
  filtroEvolucao?: string | null;
  filtroHospitalizado?: string | null;
}) {
  const [riscoData, setRiscoData] = useState<any>(null);
  const [vulnData, setVulnData] = useState<any>(null);
  const [hospitaisData, setHospitaisData] = useState<any[]>([]);

  useEffect(() => {
    // Busca os polígonos que curámos no MongoDB (apenas na montagem)
    api.get('/dashboard/mapas/risco').then(res => setRiscoData(res.data)).catch(() => {});
    api.get('/dashboard/mapas/vulnerabilidade').then(res => setVulnData(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    // Busca dados dos hospitais quando a doença ou filtros locais mudam
    api.get('/dashboard/mapas/casos', { 
      params: { 
        doenca, 
        ano: filtroAno, 
        sexo: filtroSexo,
        evolucao: filtroEvolucao,
        hospitalizado: filtroHospitalizado
      } 
    })
      .then(res => {
        setHospitaisData(res.data);
      })
      .catch(err => console.error("Erro ao buscar dados dos hospitais:", err));
  }, [doenca, filtroAno, filtroSexo, filtroEvolucao, filtroHospitalizado]);

  // Estilos das nossas camadas geográficas
  // Risco de inundação (Água) -> Azul/Ciano
  const estiloRisco = { color: '#0ea5e9', weight: 1.5, fillOpacity: 0.15, dashArray: '4' }; 
  // Vulnerabilidade -> Roxo
  const estiloVuln = { color: '#8b5cf6', weight: 1.5, fillOpacity: 0.15 }; 

  return (
    <MapContainer 
      center={CENTRO_CAMPINAS} 
      zoom={12} 
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
    >
      {/* Controlo de Camadas (aquela caixinha no canto superior direito) */}
      <LayersControl position="topright">
        
        {/* Camada Base 1: O Mapa Escuro (combina com o nosso tema!) */}
        <LayersControl.BaseLayer checked name="Mapa Escuro">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
        </LayersControl.BaseLayer>

        {/* Camada Base 2: O Mapa Claro Padrão */}
        <LayersControl.BaseLayer name="Mapa Claro">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          />
        </LayersControl.BaseLayer>

        {/* Camada de Polígonos: Risco de Inundação */}
        {riscoData && (
          <LayersControl.Overlay checked name="Risco de Inundação">
            <GeoJSON 
              data={riscoData} 
              style={estiloRisco} 
              onEachFeature={(feature, layer) => {
                // Adiciona um balão ao clicar no polígono
                if (feature.properties && feature.properties.CLASSE) {
                  layer.bindPopup(`<b>Nível de Risco:</b> ${feature.properties.CLASSE}`);
                }
              }} 
            />
          </LayersControl.Overlay>
        )}

        {/* Camada de Polígonos: Vulnerabilidade Habitacional */}
        {vulnData && (
          <LayersControl.Overlay checked name="Vulnerabilidade Habitacional">
            <GeoJSON 
              data={vulnData} 
              style={estiloVuln}
              onEachFeature={(feature, layer) => {
                if (feature.properties && feature.properties.NOME_AREA) {
                  layer.bindPopup(`<b>Área:</b> ${feature.properties.NOME_AREA}`);
                }
              }}
            />
          </LayersControl.Overlay>
        )}

        {/* Camada de Hospitais/Unidades de Saúde */}
        {hospitaisData.length > 0 && (
          <LayersControl.Overlay checked name="Unidades de Saúde (Hospitais)">
            <LayerGroup>
              {hospitaisData.map((h, idx) => {
                // Dimensão proporcional aos casos (Reduzido max para 25 para evitar poluição visual)
                const radius = Math.max(4, Math.min(25, Math.sqrt(h.total_casos || 0) * 1.5));
                return (
                  <CircleMarker
                    key={`hosp-${idx}`}
                    center={[h.latitude, h.longitude]}
                    radius={radius}
                    pathOptions={{
                      color: '#ffffff', // Borda Branca para destacar
                      fillColor: '#f43f5e', // Rosa/Vermelho
                      fillOpacity: 0.5,     // Mais transparente para ver as sobreposições
                      weight: radius > 10 ? 1 : 0.5 // Borda mais fina em bolhas pequenas
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -radius]} opacity={1}>
                      <div className="text-slate-800 p-1">
                        <strong className="block text-sm mb-1">{h.hospital}</strong>
                        <span className="text-xs text-rose-600 font-bold">{h.total_casos?.toLocaleString('pt-BR')} Casos</span>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </LayerGroup>
          </LayersControl.Overlay>
        )}

      </LayersControl>
    </MapContainer>
  );
}