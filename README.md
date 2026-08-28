# YOLO Video Analytics

Aplicação web que faz **reconhecimento de pessoas e objetos em vídeos do YouTube** em tempo real: você cola o link de um vídeo, o assiste direto na página e vê as detecções do modelo YOLO sobrepostas ao vídeo, sincronizadas quadro a quadro, além de estatísticas agregadas de tudo que foi detectado.

## Objetivos do projeto

- **Análise automática de vídeo**: baixar um vídeo do YouTube, rodar um modelo de visão computacional (YOLO) sobre os frames e gerar uma *timeline* com todas as detecções (classe, confiança e posição na tela) ao longo do tempo.
- **Experiência em tempo real**: em vez de processar e baixar um vídeo anotado, as caixas de detecção são desenhadas por cima do player do YouTube no navegador, sincronizadas com o instante atual da reprodução.
- **Estatísticas agregadas**: contagem de detecções por classe, modelo utilizado, taxa de análise e duração processada.
- **Eficiência**: resultados em cache por vídeo — analisar o mesmo vídeo duas vezes é instantâneo.

## Como funciona

1. Você cola uma URL do YouTube (`watch`, `youtu.be`, `shorts`, `embed` ou `live`) no frontend.
2. O frontend cria um **job** na API e reproduz o vídeo com o player do YouTube.
3. O backend baixa o vídeo (stream de vídeo H.264 ≤720p, sem áudio) com `yt-dlp`.
4. O pipeline roda **YOLO11** (ou YOLOv8 como fallback) sobre os frames a 5 fps, gerando a timeline de detecções.
5. A timeline é salva em cache (`backend/cache/`) e o vídeo baixado é descartado.
6. O frontend consulta o progresso do job e, ao concluir, sobrepõe as caixas de detecção ao player conforme o tempo do vídeo avança.

> O projeto foi desenhado para rodar **em CPU, sem GPU e sem ffmpeg** no sistema: o download usa um stream único de vídeo H.264 (decodificado pelo OpenCV embutido) e a inferência usa o modelo *nano* (`yolo11n.pt`). Se houver GPU com CUDA disponível, ela é usada automaticamente.

## Stack

| Camada | Tecnologias |
|---|---|
| Backend | Python 3.12, FastAPI, Uvicorn, Ultralytics (YOLO), PyTorch, OpenCV, yt-dlp |
| Frontend | React 19, TypeScript, Vite, Material UI (MUI), YouTube IFrame Player API |

## Estrutura do projeto

```
backend/
  app/
    main.py        # Endpoints da API (FastAPI)
    jobs.py        # Jobs assíncronos em memória (download + análise)
    pipeline.py    # Download (yt-dlp) e inferência YOLO (OpenCV)
  cache/           # GERADO EM RUNTIME — timelines em cache + vídeos temporários
  requirements.txt
  yolo11n.pt       # Pesos do modelo (incluídos no repo; baixados se ausentes)
  yolov8n.pt       # Pesos alternativos (fallback)
frontend/
  src/
    components/    # Player, overlay de detecções, painel de estatísticas
    hooks/         # Controle do player do YouTube
    services/      # Cliente da API
  vite.config.ts   # Proxy /api -> http://127.0.0.1:8000
```

### Pastas geradas e permissões

| Caminho | Origem | Observações |
|---|---|---|
| `backend/venv/` | Criado por você (`python3 -m venv`) | Ambiente virtual; não vai para o git |
| `backend/cache/` | Criado pelo backend em runtime | Precisa de **permissão de escrita**: grava as timelines (`*.timeline.json`) e os vídeos durante o download (o vídeo é apagado após a análise) |
| `backend/*.pt` | Vem no repositório | Se apagar, o Ultralytics baixa de novo na primeira análise (precisa de internet e escrita em `backend/`) |
| `frontend/node_modules/` | Criado pelo `npm install` | Dependências do frontend; não vai para o git |

Não é necessário criar nenhuma pasta manualmente: o `cache/` é criado automaticamente na primeira execução, desde que o usuário que roda o backend tenha permissão de escrita em `backend/`.

## Requisitos do sistema

| Requisito | Detalhe |
|---|---|
| Sistema operacional | Linux, macOS ou Windows |
| Python | **3.11 ou superior** (testado com 3.12) |
| Node.js + npm | **Node 20 ou superior** (LTS recomendado) |
| Git | Para clonar o repositório |
| RAM | Mínimo 4 GB livres (recomendado 8 GB para inferência em CPU) |
| Espaço em disco | **~4 GB** para as dependências do backend (PyTorch + CUDA libs são grandes) + ~500 MB para `node_modules` |
| Internet | Necessária para instalar dependências, baixar os pesos do modelo (se ausentes) e baixar os vídeos do YouTube |
| ffmpeg | **Não é necessário** |
| GPU (CUDA) | **Opcional** — tudo roda em CPU; se houver GPU, é usada automaticamente |

## Instalação e execução

### 1. Clonar o repositório

```bash
git clone https://github.com/KiuryMariano/yolo-video-analytics.git
cd yolo-video-analytics
```

### 2. Backend (API FastAPI) — Terminal 1

Suba **primeiro o backend**, pois o frontend depende dele.

```bash
cd backend

# Criar e ativar o ambiente virtual
python3 -m venv venv
source venv/bin/activate        # Linux/macOS
# venv\Scripts\activate         # Windows (use sem "source", no cmd)

# Instalar as dependências (o download do PyTorch é grande, pode demorar)
pip install -r requirements.txt

# Subir a API
uvicorn app.main:app --reload --port 8000
```

**Verifique que o backend subiu** — em outro terminal (ou no navegador):

```bash
curl http://127.0.0.1:8000/api/health
# Resposta esperada: {"status":"ok"}
```

- A API roda na porta **8000** e a documentação interativa (Swagger) fica em <http://127.0.0.1:8000/docs>.
- Deixe este terminal aberto enquanto usar a aplicação; para parar o servidor, `Ctrl+C`.
- Se os pesos `yolo11n.pt`/`yolov8n.pt` não existirem em `backend/`, o Ultralytics baixa os pesos automaticamente na primeira análise.

### 3. Frontend (React + Vite) — Terminal 2

Com o backend rodando, abra um **segundo terminal**:

```bash
cd frontend
npm install
npm run dev
```

**Verifique que o frontend subiu** — o terminal do Vite mostra algo como:

```
VITE v8.x.x  ready in ... ms
➜  Local:   http://localhost:5173/
```

- A aplicação roda na porta **5173**. O Vite já está configurado para redirecionar as chamadas `/api` para o backend em `127.0.0.1:8000` — não é preciso configurar mais nada.
- Se o backend não estiver no ar, a aplicação abre mas a análise falha com "Backend indisponível".

### 4. Usar a aplicação

1. Abra <http://localhost:5173>.
2. Cole um link do YouTube (ex.: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`) e confirme.
3. Acompanhe o progresso (download 0–45%, análise 45–100%). Vídeos já analisados aparecem na hora (cache).
4. Dê play no vídeo: as caixas de detecção aparecem sincronizadas com a reprodução, e o painel lateral mostra as estatísticas.

> **Dica:** use vídeos curtos para testar. Por padrão, apenas os **primeiros 240 segundos** de cada vídeo são analisados (configurável, veja abaixo).

## Configurações (variáveis de ambiente)

Definidas no backend, com valores padrão sensatos:

| Variável | Padrão | Descrição |
|---|---|---|
| `YOLO_MAX_DURATION` | `240` | Duração máxima do vídeo analisada, em segundos |
| `YOLO_ANALYSIS_FPS` | `5` | Frames analisados por segundo de vídeo |
| `YOLO_CONF` | `0.30` | Limiar de confiança das detecções |
| `YOLO_IMGSZ` | `512` | Tamanho da imagem de entrada da inferência |

Exemplo:

```bash
YOLO_MAX_DURATION=60 YOLO_ANALYSIS_FPS=10 uvicorn app.main:app --reload --port 8000
```

## API

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/analyze` | Inicia a análise de um vídeo. Body: `{"url": "https://..."}` |
| `GET` | `/api/jobs/{job_id}` | Status do job (`downloading`, `analyzing`, `done`, `error`) e progresso |
| `GET` | `/api/jobs/{job_id}/timeline` | Timeline completa de detecções (após conclusão) |
| `GET` | `/api/health` | Verificação de saúde da API |

## Observações

- **Cache por vídeo**: as timelines ficam em `backend/cache/<videoId>.timeline.json`. Apague o arquivo do vídeo para forçar uma nova análise.
- **Jobs em memória**: os jobs não sobrevivem a um reinício da API, mas as timelines em cache sim — reanalisar um vídeo já processado retorna resultado instantâneo.
- **Sem áudio**: o stream baixado não tem áudio (a detecção não usa áudio e isso dispensa ffmpeg para mesclar streams).
- **Vídeos truncados**: quando o vídeo excede a duração máxima, a timeline é marcada como `truncated` e o painel de estatísticas indica isso.
