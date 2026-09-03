import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogContent,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ActivityHeader from '../../components/ActivityHeader'
import type { DocSection } from '../../components/DocumentationModal'
import { listImages, previewUrl, uploadImage } from './services/imageService'
import type { StoredImage } from './services/imageService'

function formatSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const DOCS: DocSection[] = [
  {
    heading: 'Objetivo',
    body: 'API em Python (FastAPI) que salva imagens em um banco de dados e uma página web com upload, tabela das imagens salvas e pré-visualização.',
  },
  {
    heading: 'Como foi construída',
    body: 'Backend em Python com FastAPI (pasta image-database/backend) usando SQLite puro, sem ORM: a tabela images guarda os metadados (nome, tipo, tamanho, data) e os bytes da imagem em uma coluna BLOB. Frontend em React 19 + TypeScript + Material UI (página src/pages/ImageDatabase), com o proxy do Vite direcionando /api/images para a porta 8001.',
  },
  {
    heading: 'Como funciona',
    body: (
      <ol style={{ margin: 0, paddingLeft: 20 }}>
        <li>Você escolhe um arquivo e confirma o upload.</li>
        <li>O backend valida o tipo (JPEG, PNG, GIF, WebP ou SVG) e grava os bytes como BLOB no SQLite.</li>
        <li>A tabela lista as imagens salvas consultando os metadados.</li>
        <li>O botão de pré-visualização busca os bytes por ID e exibe a imagem em um modal.</li>
      </ol>
    ),
  },
  {
    heading: 'Endpoints da API',
    body: (
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        <li>POST /api/images — upload multipart de uma imagem</li>
        <li>GET /api/images — lista as imagens salvas (metadados)</li>
        <li>GET /api/images/&#123;id&#125;/preview — devolve os bytes da imagem</li>
        <li>GET /api/health — verificação de saúde</li>
      </ul>
    ),
  },
]

export default function ImageDatabasePage() {
  const [images, setImages] = useState<StoredImage[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const refresh = useCallback(() => {
    listImages()
      .then(setImages)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Falha ao carregar imagens.')
      })
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleSave = useCallback(() => {
    if (!selectedFile) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    uploadImage(selectedFile)
      .then((result) => {
        setSuccess(`Imagem "${result.filename}" salva com sucesso.`)
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        refresh()
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Falha ao salvar imagem.')
      })
      .finally(() => setSaving(false))
  }, [selectedFile, refresh])

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <ActivityHeader
        title="Banco de Imagens"
        subtitle="Upload de imagens persistidas em banco de dados (FastAPI + SQLite)"
        docsSections={DOCS}
      />

      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileIcon />}
              disabled={saving}
            >
              Escolher imagem
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  setSelectedFile(event.target.files?.[0] ?? null)
                  setSuccess(null)
                  setError(null)
                }}
              />
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              {selectedFile ? `${selectedFile.name} (${formatSize(selectedFile.size)})` : 'Nenhum arquivo selecionado'}
            </Typography>
            <Button variant="contained" onClick={handleSave} disabled={!selectedFile || saving}>
              {saving ? 'Salvando…' : 'Salvar no banco'}
            </Button>
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nome do arquivo</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Tamanho</TableCell>
                <TableCell>Enviado em</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {images.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" color="text.secondary">
                    Nenhuma imagem salva ainda.
                  </TableCell>
                </TableRow>
              )}
              {images.map((image) => (
                <TableRow key={image.id}>
                  <TableCell>{image.id}</TableCell>
                  <TableCell>{image.filename}</TableCell>
                  <TableCell>{image.content_type}</TableCell>
                  <TableCell align="right">{formatSize(image.size)}</TableCell>
                  <TableCell>{image.uploaded_at}</TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => setPreviewId(image.id)}
                    >
                      Pré-visualizar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>

      <Dialog
        open={previewId !== null}
        onClose={() => setPreviewId(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            {previewId !== null && (
              <img
                src={previewUrl(previewId)}
                alt={`Pré-visualização da imagem ${previewId}`}
                style={{ maxWidth: '100%', maxHeight: '70vh' }}
              />
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  )
}
