import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import '@root/index.sass'
import App from '@root/App'
import { store } from '@redux/store'
import { getCloudName } from '@root/utils/env'

// Initialize and validate runtime environment variables
// This ensures VITE_CLOUD_NAME is available at runtime if injected via window.__ENV__
if (typeof window !== 'undefined') {
  getCloudName();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
