import type { CSSObject } from '@mui/material/styles'

export const scrollbarSx: CSSObject = {
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(255, 255, 255, 0.18) transparent',
  '&::-webkit-scrollbar': { width: 8, height: 8 },
  '&::-webkit-scrollbar-track': { background: 'transparent' },
  '&::-webkit-scrollbar-thumb': {
    bgcolor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 8,
    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
  },
  '&::-webkit-scrollbar-corner': { background: 'transparent' },
}
