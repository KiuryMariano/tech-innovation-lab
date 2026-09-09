import { useState } from 'react'
import { Button } from '@mui/material'
import { Link } from 'react-router'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DescriptionIcon from '@mui/icons-material/Description'
import DocumentationModal from './DocumentationModal'
import type { DocSection } from './DocumentationModal'

interface ActivityActionsProps {
  activityTitle: string
  docsSections: DocSection[]
  compact?: boolean
}

export default function ActivityActions({
  activityTitle,
  docsSections,
  compact = false,
}: ActivityActionsProps) {
  const [docsOpen, setDocsOpen] = useState(false)
  const compactProps = compact
    ? {
        size: 'small' as const,
        color: 'inherit' as const,
        sx: { justifyContent: 'flex-start', color: 'text.secondary' },
      }
    : {}

  return (
    <>
      <Button component={Link} to="/" startIcon={<ArrowBackIcon />} {...compactProps}>
        Voltar ao menu
      </Button>
      <Button startIcon={<DescriptionIcon />} onClick={() => setDocsOpen(true)} {...compactProps}>
        Documentação
      </Button>
      <DocumentationModal
        open={docsOpen}
        onClose={() => setDocsOpen(false)}
        activityTitle={activityTitle}
        sections={docsSections}
      />
    </>
  )
}
