# Tech Innovation Lab

Lab de atividades da disciplina: um **app React único na raiz** com **menu principal** e uma **rota por atividade**, cada uma com seu **backend em Python/FastAPI** dentro da própria pasta.

Cada tela de atividade possui botão **Voltar ao menu** e botão **Documentação**, que abre um modal explicando como aquela atividade foi construída e como funciona.

## Atividades

| # | Atividade | Rota | Descrição | Backend | Porta |
|---|---|---|---|---|---|
| 1 | **YOLO Video Analytics** | `/yolo-analytics` | Detecção de pessoas e objetos em vídeos do YouTube com YOLO, sobreposta ao player em tempo real | `yolo-video-analytics/backend` | 8000 |
| 2 | **Banco de Imagens** | `/image-database` | Upload de imagens com persistência em banco de dados (SQLite), tabela e pré-visualização | `image-database/backend` | 8001 |

## Estrutura do repositório

```
tech-innovation-lab/
├── src/                          # App React único (menu + atividades)
│   ├── main.tsx                  # Entrada: React + BrowserRouter + tema MUI
│   ├── App.tsx                   # Rotas de navegação
│   ├── theme.ts                  # Tema MUI global
│   ├── components/               # Componentes compartilhados
│   │   ├── ActivityHeader.tsx    #   Cabeçalho padrão (voltar, documentação, título)
│   │   └── DocumentationModal.tsx#   Modal de documentação da atividade
│   └── pages/
│       ├── Menu/                 # Rota "/" — menu principal da disciplina
│       ├── YoloAnalytics/        # Atividade 1 (componentes, hooks, serviços)
│       └── ImageDatabase/        # Atividade 2 (serviço da API)
├── vite.config.ts                # Porta 5173 + proxy /api (8000) e /api/images (8001)
├── yolo-video-analytics/
│   └── backend/                  # Atividade 1 — FastAPI
│       ├── app/
│       │   ├── main.py           # Endpoints da API
│       │   ├── jobs.py           # Jobs assíncronos em memória (download + análise)
│       │   └── pipeline.py       # Download (yt-dlp) e inferência YOLO (OpenCV)
│       ├── cache/                # GERADO EM RUNTIME — timelines em cache
│       ├── requirements.txt
│       ├── yolo11n.pt            # Pesos do modelo (baixados automaticamente se ausentes)
│       └── yolov8n.pt            # Pesos alternativos (fallback)
└── image-database/
    └── backend/                  # Atividade 2 — FastAPI
        ├── app/
        │   ├── main.py           # Endpoints da API (upload, lista, preview)
        │   └── database.py       # Conexão e criação da tabela (SQLite)
        ├── images.db             # GERADO EM RUNTIME — banco SQLite
        └── requirements.txt
```

## Stack

| Camada | Tecnologias |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router, Material UI (MUI) |
| Atividade 1 | Python 3.12, FastAPI, Ultralytics (YOLO11/v8), PyTorch, OpenCV, yt-dlp |
| Atividade 2 | Python 3.12, FastAPI, SQLite (sqlite3, sem ORM), python-multipart |

## Requisitos do sistema

| Requisito | Detalhe |
|---|---|
| Sistema operacional | Linux, macOS ou Windows |
| Python | **3.11 ou superior** (testado com 3.12) |
| Node.js + npm | **Node 20 ou superior** (LTS recomendado) |
| RAM | 4 GB livres (8 GB recomendados para inferência em CPU) |
| Disco | ~4 GB (PyTorch da atividade 1) + ~500 MB (`node_modules`) |
| GPU (CUDA) | Opcional — atividade 1 roda em CPU e usa GPU automaticamente se disponível |

## Como executar

### 1. Frontend (raiz) — obrigatório

```bash
npm install
npm run dev
```

A aplicação sobe em <http://localhost:5173> — o **menu principal**. As chamadas `/api` são redirecionadas pelo proxy do Vite para os backends, sem configuração extra.

### 2. Backend da Atividade 1 (porta 8000)

```bash
cd yolo-video-analytics/backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt   # o download do PyTorch é grande
uvicorn app.main:app --reload --port 8000
```

### 3. Backend da Atividade 2 (porta 8001)

```bash
cd image-database/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

### Verificação

```bash
curl http://127.0.0.1:8000/api/health   # {"status":"ok"}
curl http://127.0.0.1:8001/api/health   # {"status":"ok"}
```

---

## Atividade 1 — YOLO Video Analytics

**Objetivo:** analisar vídeos do YouTube com um modelo de visão computacional (YOLO) e exibir as detecções sobrepostas ao player, sincronizadas com a reprodução, além de estatísticas agregadas por classe.

**Como funciona:**

1. A URL colada vira um job assíncrono no backend.
2. O vídeo é baixado em H.264 (até 720p, sem áudio — dispensa ffmpeg).
3. O modelo analisa os frames a 5 fps gerando a timeline (classe, confiança e posição das caixas).
4. A timeline fica em cache (`backend/cache/`) — rever o mesmo vídeo é instantâneo.
5. O player do YouTube reproduz o vídeo e as caixas são desenhadas conforme o tempo avança.

**Configurações (variáveis de ambiente no backend):**

| Variável | Padrão | Descrição |
|---|---|---|
| `YOLO_MAX_DURATION` | `240` | Duração máxima do vídeo analisada (segundos) |
| `YOLO_ANALYSIS_FPS` | `5` | Frames analisados por segundo |
| `YOLO_CONF` | `0.30` | Limiar de confiança das detecções |
| `YOLO_IMGSZ` | `512` | Tamanho da imagem de entrada da inferência |

**API:**

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/analyze` | Inicia a análise. Body: `{"url": "https://..."}` |
| `GET` | `/api/jobs/{job_id}` | Status do job (`downloading`, `analyzing`, `done`, `error`) |
| `GET` | `/api/jobs/{job_id}/timeline` | Timeline completa de detecções |
| `GET` | `/api/health` | Verificação de saúde |

**Observações:** jobs vivem em memória (não sobrevivem a reinício), mas o cache de timelines sim. Apague `backend/cache/<videoId>.timeline.json` para forçar nova análise. Sem GPU, tudo roda em CPU.

---

## Atividade 2 — Banco de Imagens

**Objetivo:** API que salva imagens em um banco de dados e página web com upload, tabela das imagens salvas e pré-visualização em modal.

**Como funciona:**

1. Você escolhe um arquivo e confirma o upload.
2. O backend valida o tipo (JPEG, PNG, GIF, WebP ou SVG) e grava os bytes como **BLOB** no SQLite, junto com nome, tipo, tamanho e data.
3. A tabela lista as imagens salvas consultando os metadados.
4. O botão **Pré-visualizar** busca os bytes por ID e exibe a imagem em um modal.

**API:**

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/images` | Upload multipart de uma imagem |
| `GET` | `/api/images` | Lista as imagens salvas (metadados) |
| `GET` | `/api/images/{id}/preview` | Devolve os bytes da imagem |
| `GET` | `/api/health` | Verificação de saúde |

**Observações:** o banco `backend/images.db` é criado automaticamente na primeira execução (não vai para o git). Não há ORM — o `database.py` usa `sqlite3` diretamente, de propósito, para fins didáticos.

---

## Como adicionar uma nova atividade

1. **Backend:** crie `<atividade>/backend/` com FastAPI e sua própria porta (8002, 8003, …).
2. **Página:** crie `src/pages/<Nome>/` e use o componente `ActivityHeader` (título, subtítulo, botão voltar, botão de documentação e modal), passando as seções de documentação da atividade.
3. **Rota:** registre em `src/App.tsx`.
4. **Menu:** adicione o card em `src/pages/Menu/index.tsx` (o slot "Em breve" vira a nova atividade).
5. **Proxy:** se precisar de prefixo próprio, adicione a regra em `vite.config.ts` (regras mais específicas antes de `/api`).

## Pastas geradas em runtime (ignoradas pelo git)

| Caminho | Origem |
|---|---|
| `*/backend/venv/` | Ambiente virtual criado por você (`python3 -m venv`) |
| `yolo-video-analytics/backend/cache/` | Timelines em cache + vídeos temporários |
| `image-database/backend/images.db` | Banco SQLite da atividade 2 |
| `node_modules/` e `dist/` | Dependências e build do frontend |
