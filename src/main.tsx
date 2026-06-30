import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import V2 from './V2'
import './styles.css'
import './v2.css'

const Root = window.location.pathname.startsWith('/v2') ? V2 : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
