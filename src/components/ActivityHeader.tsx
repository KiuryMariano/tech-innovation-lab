import { useState } from 'react'
import { Link } from 'react-router'
import { Box, Button, Stack, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DescriptionIcon from '@mui/icons-material/Description'
import DocumentationModal from './DocumentationModal'
import type { DocSection } from './DocumentationModal'

interface ActivityHeaderProps {
  title: string
  subtitle: string
  docsSections: DocSection[]
}

export default function ActivityHeader({ title, subtitle, docsSections }: ActivityHeaderProps) {
  const [docsOpen, setDocsOpen] = useState(false)
  return (
    <>
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
        <Button component={Link} to="/" startIcon={<ArrowBackIcon />}>
          Voltar ao menu
        </Button>
        <Button startIcon={<DescriptionIcon />} onClick={() => setDocsOpen(true)}>
          Documentação
        </Button>
      </Box>
      <Stack spacing={0.5} sx={{ textAlign: 'center', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Stack>
      <DocumentationModal
        open={docsOpen}
        onClose={() => setDocsOpen(false)}
        activityTitle={title}
        sections={docsSections}
      />
    </>
  )
}
