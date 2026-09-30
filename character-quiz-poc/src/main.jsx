import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './base.css'
import Quiz from './Quiz.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Quiz />
  </StrictMode>,
)
