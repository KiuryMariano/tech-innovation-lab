import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0b1120', paper: '#111827' },
    primary: { main: '#22d3ee', contrastText: '#04202b' },
    secondary: { main: '#f43f5e' },
    success: { main: '#4ade80' },
  },
  shape: { borderRadius: 12 },
  typography: {
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
})
