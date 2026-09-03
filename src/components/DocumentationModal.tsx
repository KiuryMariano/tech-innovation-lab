import type { ReactNode } from 'react'
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

export interface DocSection {
  heading: string
  body: ReactNode
}

interface DocumentationModalProps {
  open: boolean
  onClose: () => void
  activityTitle: string
  sections: DocSection[]
}

export default function DocumentationModal({
  open,
  onClose,
  activityTitle,
  sections,
}: DocumentationModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 2 }}
      >
        Documentação — {activityTitle}
        <IconButton onClick={onClose} size="small" aria-label="Fechar">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {sections.map((section) => (
            <Box key={section.heading}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
                {section.heading}
              </Typography>
              <Typography variant="body2" color="text.secondary" component="div">
                {section.body}
              </Typography>
            </Box>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
