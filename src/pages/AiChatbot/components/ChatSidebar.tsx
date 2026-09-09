import { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ActivityActions from '../../../components/ActivityActions'
import type { DocSection } from '../../../components/DocumentationModal'
import { scrollbarSx } from '../scrollbarSx'
import type { Conversation } from '../services/chatService'

interface ChatSidebarProps {
  conversations: Conversation[]
  activeId: number | null
  onSelect: (conversationId: number) => void
  onNew: () => void
  docsSections: DocSection[]
  onRename: (conversationId: number, title: string) => void
  onDelete: (conversationId: number) => void
}

export default function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  docsSections,
  onRename,
  onDelete,
}: ChatSidebarProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [menuConversation, setMenuConversation] = useState<Conversation | null>(null)
  const [renameTarget, setRenameTarget] = useState<Conversation | null>(null)
  const [renameTitle, setRenameTitle] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null)

  const closeMenu = () => {
    setMenuAnchor(null)
    setMenuConversation(null)
  }

  const openRename = () => {
    setRenameTitle(menuConversation?.title ?? '')
    setRenameTarget(menuConversation)
    closeMenu()
  }

  const confirmRename = () => {
    const title = renameTitle.trim()
    if (!title || renameTarget === null) return
    onRename(renameTarget.id, title)
    setRenameTarget(null)
  }

  const confirmDelete = () => {
    if (deleteTarget === null) return
    onDelete(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <Stack
      sx={{
        width: { xs: 1, md: 260 },
        flexShrink: 0,
        height: { xs: 'auto', md: 1 },
        maxHeight: { xs: 240, md: 'none' },
        bgcolor: 'background.default',
        borderRight: { md: 1 },
        borderColor: 'divider',
        p: 1.5,
        gap: 1.5,
      }}
    >
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={onNew}
        sx={{ justifyContent: 'flex-start', borderRadius: 2 }}
      >
        Nova conversa
      </Button>
      {conversations.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', px: 2 }}>
          Nenhuma conversa ainda.
        </Typography>
      ) : (
        <List dense disablePadding sx={[{ overflowY: 'auto', flex: 1, minHeight: 0 }, scrollbarSx]}>
          {conversations.map((conversation) => (
            <ListItemButton
              key={conversation.id}
              selected={conversation.id === activeId}
              onClick={() => onSelect(conversation.id)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '& .conversation-item-menu': {
                  opacity: { xs: 1, md: 0 },
                  transition: 'opacity 0.15s',
                },
                '&:hover .conversation-item-menu, &.Mui-selected .conversation-item-menu': {
                  opacity: 1,
                },
              }}
            >
              <ListItemText
                primary={conversation.title}
                slotProps={{ primary: { variant: 'body2', noWrap: true } }}
                sx={{ pr: 0.5 }}
              />
              <IconButton
                className="conversation-item-menu"
                size="small"
                aria-label={`Opções da conversa ${conversation.title}`}
                onClick={(event) => {
                  event.stopPropagation()
                  setMenuAnchor(event.currentTarget)
                  setMenuConversation(conversation)
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </ListItemButton>
          ))}
        </List>
      )}
      <Stack sx={{ mt: 'auto', gap: 0.5 }}>
        <ActivityActions activityTitle="Chatbot com IA" docsSections={docsSections} compact />
      </Stack>

      <Menu
        anchorEl={menuAnchor}
        open={menuAnchor !== null}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={openRename}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Renomear
        </MenuItem>
        <MenuItem onClick={() => { setDeleteTarget(menuConversation); closeMenu() }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          Apagar
        </MenuItem>
      </Menu>

      <Dialog
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Renomear conversa</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Título"
            value={renameTitle}
            onChange={(event) => setRenameTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') confirmRename()
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameTarget(null)}>Cancelar</Button>
          <Button variant="contained" onClick={confirmRename} disabled={!renameTitle.trim()}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Apagar conversa?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            “{deleteTarget?.title}” e todas as suas mensagens serão removidas. Essa ação não pode
            ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>
            Apagar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
