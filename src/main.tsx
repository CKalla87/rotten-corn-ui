import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@root/index.sass'
import App from '@root/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
