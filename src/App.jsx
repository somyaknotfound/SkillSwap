import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Navbar from './sections/Navbar'
import LandingPage from './sections/Landingpage'

function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <LandingPage />
    </div>
  )
}

export default App