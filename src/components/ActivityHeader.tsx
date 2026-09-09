import { Box, Stack, Typography } from '@mui/material'
import ActivityActions from './ActivityActions'
import type { DocSection } from './DocumentationModal'

interface ActivityHeaderProps {
  title: string
  subtitle: string
  docsSections: DocSection[]
}

export default function ActivityHeader({ title, subtitle, docsSections }: ActivityHeaderProps) {
  return (
    <>
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
        <ActivityActions activityTitle={title} docsSections={docsSections} />
      </Box>
      <Stack spacing={0.5} sx={{ textAlign: 'center', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Stack>
    </>
  )
}
