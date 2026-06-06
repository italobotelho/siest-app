# 🏥 SIEST - Sistema de Inteligência Epidemiológica e Socio-Territorial

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)

Este projeto é uma plataforma full-stack focada na **Gestão de Saúde Pública e Epidemiologia Analítica**. O **SIEST** consolida dados extraídos do SINAN (Sistema de Informação de Agravos de Notificação) e os cruza com índices de vulnerabilidade habitacional e inundações, entregando um dashboard interativo focado no combate estratégico a doenças geolocalizadas como Dengue, Zika, Chikungunya, Leptospirose e Hepatite A.

Este trabalho faz parte do currículo de **Ciência de Dados e Inteligência Artificial** da **PUC-Campinas (2026)**.

---

## 🎯 Objetivos da Plataforma

* **Inteligência Georreferenciada:** Mapear clusters de surtos epidêmicos utilizando coordenadas de latitude/longitude imputadas matematicamente.
* **Análise de Sobrecarga Hospitalar:** Quantificar e visualizar para onde a massa de pacientes se desloca no momento do adoecimento.
* **Avaliação da Vigilância Epidemiológica:** Analisar o tempo de resposta (Data-Lag) entre a data de primeiros sintomas e a efetiva notificação laboratorial ou clínico-epidemiológica.
* **Perfilamento Demográfico:** Mapear faixas etárias, sexo, escolaridade e raça dos pacientes mais afetados, cruzando com índices socioeconômicos.

---

## 🚀 Funcionalidades Principais

* **Filtros Temporais e Demográficos Inteligentes:** Altere todo o contexto do sistema cruzando os anos de incidência e o sexo biológico do paciente.
* **Mapa Epidemiológico Interativo:** Construído com `React-Leaflet`, suporta visualização de Heatmaps e Polígonos de Risco (áreas de vulnerabilidade e inundações calculadas via Shapely).
* **Termômetro de Resposta (Vigilância):** Gráficos complexos (`Nivo Stacked Bar`) avaliando a rapidez de diagnóstico do sistema público, com tratamento automático para anomalias estatísticas.
* **Grafo de Sobrecarga (Node-Link):** Utiliza `Apache ECharts` para gerar uma estrutura em rede que denuncia o colapso de UPAs e Hospitais baseado na demanda de cada doença.
* **Pirâmide Demográfica Bidirecional:** Desdobramento demográfico completo utilizando gráficos vetorizados responsivos de altíssimo desempenho.

---

## 📂 Estrutura do Repositório

Sendo uma solução robusta (Cliente-Servidor), a arquitetura do projeto foi dividida em dois grandes blocos:

| Diretório | Stack Principal | Descrição |
| :--- | :--- | :--- |
| `frontend/` | `Next.js 14`, `Tailwind CSS` | Interface do Usuário (Dashboard). Inclui gráficos customizados (`Nivo`, `ECharts`, `Recharts`) sob o diretório `/components` e comunicação de APIs via Axios em `/app/services`. |
| `backend/` | `Python`, `FastAPI` | O motor de agregação do sistema. Roteadores e agregações pesadas utilizando `PyMongo` (AsyncMongoClient) para MongoDB, com pipelines projetadas e otimizadas em `/app/routes`. |
| `.env` (Back) | `MongoDB Atlas` | String de conexão com o cluster de produção `siest_db` na nuvem. (Baseado no modelo `.env.example`). |

---

## 💻 Como Compilar e Executar

Certifique-se de ter o **Node.js** e o **Python 3.10+** instalados na sua máquina.

### 1. Executando a API (Backend)
1. Navegue até a pasta `backend/`.
2. Instale as dependências contidas no `requirements.txt`:
   ```bash
   pip install -r requirements.txt
   ```
3. Inicialize o servidor local com o `Uvicorn`:
   ```bash
   uvicorn app.main:app --reload
   ```

### 2. Executando o Dashboard (Frontend)
1. Navegue até a pasta `frontend/`.
2. Instale os pacotes Node:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento do Next.js:
   ```bash
   npm run dev
   ```

A interface estará disponível na porta `localhost:3000` comunicando-se perfeitamente com o servidor na `localhost:8000`.

---

## 📊 Status dos Dados (Aviso de Defasagem)

O SIEST implementa um sistema de alerta epidemiológico único no código (`page.tsx`) que avisa o usuário sobre o congelamento de dados do SINAN (Data-Lag). Para anos recentes (2024-2026), o sistema exibe cards técnicos justificando a ausência de casos com base nos inquéritos ambientais, processamento laboratorial e subnotificação endêmica específica para cada moléstia analisada.

---

## 🎓 Autor e Créditos

Desenvolvido por **Ítalo Botelho** e colegas como projeto acadêmico de PI na **PUC-Campinas (2026)**.
Projeto com ênfase completa na intersecção entre Desenvolvimento Web Moderno, Banco de Dados Não-Relacional e Estatística Pública de Saúde.