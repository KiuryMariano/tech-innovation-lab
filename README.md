# Tech Innovation Lab

Lab de atividades da disciplina: um **app React único na raiz** com **menu principal** e uma **rota por atividade**, cada uma com seu **backend em Python/FastAPI** dentro da própria pasta.

Cada tela de atividade possui botão **Voltar ao menu** e botão **Documentação**, que abre um modal explicando como aquela atividade foi construída e como funciona.

## Atividades

| # | Atividade | Rota | Descrição | Backend | Porta |
|---|---|---|---|---|---|
| 1 | **YOLO Video Analytics** | `/yolo-analytics` | Detecção de pessoas e objetos em vídeos do YouTube com YOLO, sobreposta ao player em tempo real | `yolo-video-analytics/backend` | 8000 |
| 2 | **Banco de Imagens** | `/image-database` | Upload de imagens com persistência em banco de dados (SQLite), tabela e pré-visualização | `image-database/backend` | 8001 |
| 3 | **Chatbot com IA** | `/ai-chatbot` | Várias conversas persistidas em SQLite (lista à esquerda), com respostas de uma API de IA configurável (padrão: Z.AI) | `ai-chatbot/backend` | 8002 |

## Estrutura do repositório

```
tech-innovation-lab/
├── src/                          # App React único (menu + atividades)
│   ├── main.tsx                  # Entrada: React + BrowserRouter + tema MUI
│   ├── App.tsx                   # Rotas de navegação
│   ├── theme.ts                  # Tema MUI global
│   ├── components/               # Componentes compartilhados
│   │   ├── ActivityActions.tsx   #   Botões padrão (voltar ao menu + documentação)
│   │   ├── ActivityHeader.tsx    #   Cabeçalho padrão (título, subtítulo, ações)
│   │   └── DocumentationModal.tsx#   Modal de documentação da atividade
│   └── pages/
│       ├── Menu/                 # Rota "/" — menu principal da disciplina
│       ├── YoloAnalytics/        # Atividade 1 (componentes, hooks, serviços)
│       ├── ImageDatabase/        # Atividade 2 (serviço da API)
│       └── AiChatbot/            # Atividade 3 (componentes, serviço da API)
├── vite.config.ts                # Porta 5173 + proxy /api (8000), /api/images (8001) e /api/chat (8002)
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
├── image-database/
│   └── backend/                  # Atividade 2 — FastAPI
│       ├── app/
│       │   ├── main.py           # Endpoints da API (upload, lista, preview)
│       │   └── database.py       # Conexão e criação da tabela (SQLite)
│       ├── images.db             # GERADO EM RUNTIME — banco SQLite
│       └── requirements.txt
└── ai-chatbot/
    └── backend/                  # Atividade 3 — FastAPI
        ├── app/
        │   ├── main.py           # Endpoints da API + proxy da IA (configurável via .env)
        │   └── database.py       # Conexão e criação das tabelas (SQLite)
        ├── .env.example          # Modelo de configuração da API de IA (copie para .env)
        ├── chat.db               # GERADO EM RUNTIME — banco SQLite das conversas
        ├── requirements.txt
        └── venv/                 # GERADO EM RUNTIME — ambiente virtual
```

## Stack

| Camada | Tecnologias |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router, Material UI (MUI) |
| Atividade 1 | Python 3.12, FastAPI, Ultralytics (YOLO11/v8), PyTorch, OpenCV, yt-dlp |
| Atividade 2 | Python 3.12, FastAPI, SQLite (sqlite3, sem ORM), python-multipart |
| Atividade 3 | Python 3.12, FastAPI, SQLite (sqlite3, sem ORM), requests (API de IA compatível com OpenAI) |

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

### 4. Backend da Atividade 3 (porta 8002)

```bash
cd ai-chatbot/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env    # e preencha a AI_API_KEY no .env (veja seção da atividade 3)
uvicorn app.main:app --reload --port 8002
```

### Verificação

```bash
curl http://127.0.0.1:8000/api/health   # {"status":"ok"}
curl http://127.0.0.1:8001/api/health   # {"status":"ok"}
curl http://127.0.0.1:8002/api/health   # {"status":"ok"}
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

## Atividade 3 — Chatbot com IA

**Objetivo:** chatbot com várias conversas: a lista fica no menu à esquerda e é persistida em banco de dados SQLite, enquanto as respostas vêm de uma IA real — o backend funciona como proxy da API de IA **de qualquer provedora compatível com OpenAI** (Z.AI por padrão), e a chave nunca chega ao navegador.

**Como funciona:**

1. O botão **Nova conversa** limpa a seleção; a conversa só nasce no banco quando a primeira mensagem é enviada.
2. O título da conversa é a própria primeira mensagem (limitada a 60 caracteres).
3. Ao enviar uma mensagem, o backend grava no SQLite, monta o histórico completo e repassa para a API de IA configurada.
4. A resposta da IA é gravada no banco e exibida como nova mensagem do assistente.
5. Clicar em uma conversa da lista recarrega o histórico do banco — nada se perde ao fechar ou recarregar a página.

**Configuração:** preencha o arquivo `ai-chatbot/backend/.env` (copie do `.env.example`; o `.env` real não vai para o git). O padrão é a API GLM da **Z.AI**, mas **qualquer provedora com API no formato OpenAI** funciona — basta trocar a URL base, a chave e (opcionalmente) o modelo.

| Variável | Padrão | Descrição |
|---|---|---|
| `AI_BASE_URL` | `https://api.z.ai/api/paas/v4` | URL base da API de IA (compatível com OpenAI; o backend anexa `/chat/completions`) |
| `AI_API_KEY` | — | **Obrigatória** para conversar. Sem ela o backend sobe, mas responde 503 |
| `AI_MODEL` | `glm-4.5-flash` | Modelo usado na conversa |

**Provedoras conhecidas compatíveis (formato OpenAI):**

| Provedora | `AI_BASE_URL` | Exemplo de `AI_MODEL` | Chave em |
|---|---|---|---|
| Z.AI (padrão) | `https://api.z.ai/api/paas/v4` | `glm-4.5-flash` | <https://z.ai/manage-apikey/apikey-list> |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` | <https://platform.openai.com/api-keys> |
| OpenRouter | `https://openrouter.ai/api/v1` | `deepseek/deepseek-chat-v3:free` | <https://openrouter.ai/keys> |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` | <https://console.groq.com/keys> |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-2.0-flash` | <https://aistudio.google.com/apikey> |
| Mistral | `https://api.mistral.ai/v1` | `mistral-small-latest` | <https://console.mistral.ai/api-keys> |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` | <https://platform.deepseek.com> |

Observações: os nomes de modelos mudam com frequência — confira sempre o catálogo atual de cada provedora. Alguns modelos do OpenRouter têm sufixo `:free` (gratuitos, com limite diário). Provedoras fora do formato OpenAI (ex.: Anthropic Claude API nativa) exigiriam adaptar o `main.py`.

**API:**

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/chat/conversations` | Lista as conversas (mais recentes primeiro) |
| `GET` | `/api/chat/conversations/{id}/messages` | Mensagens de uma conversa |
| `POST` | `/api/chat/messages` | Envia mensagem. Body: `{"conversationId": 1, "content": "..."}` (`conversationId` nulo cria a conversa) |
| `PATCH` | `/api/chat/conversations/{id}` | Renomeia a conversa. Body: `{"title": "..."}` |
| `DELETE` | `/api/chat/conversations/{id}` | Apaga a conversa e suas mensagens (cascade) |
| `GET` | `/api/health` | Verificação de saúde |

**Observações:** o banco `backend/chat.db` é criado automaticamente na primeira execução (não vai para o git). Sem ORM — o `database.py` usa `sqlite3` diretamente, no mesmo estilo da atividade 2. Erros da IA (chave inválida, timeout, resposta inesperada) chegam ao frontend como mensagens em português.

---

## Como adicionar uma nova atividade

1. **Backend:** crie `<atividade>/backend/` com FastAPI e sua própria porta (8003, 8004, …).
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
| `ai-chatbot/backend/chat.db` | Banco SQLite das conversas da atividade 3 |
| `node_modules/` e `dist/` | Dependências e build do frontend |
