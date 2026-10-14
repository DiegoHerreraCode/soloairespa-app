import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { SoloAireSpaApp } from './SoloAireSpaApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SoloAireSpaApp />
  </StrictMode>,
)
