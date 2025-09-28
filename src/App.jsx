import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './sections/Navbar'
import LandingPage from './sections/Landingpage'
import Marketplace from './sections/Marketplace'
import MyProfile from './sections/MyProfile'
import SkillDetail from './sections/SkillDetail'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AuthCallback from './pages/AuthCallback'
import CourseManagement from './pages/CourseManagement'
import Leaderboard from './components/Leaderboard'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Navbar />
          <div className="pt-16">
            <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/skill/:skillId" element={<SkillDetail />} />
            <Route path="/course/:skillId" element={<SkillDetail />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/leaderboard/weekly" element={<Leaderboard />} />
            <Route path="/leaderboard/monthly" element={<Leaderboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route 
              path="/my-skills" 
              element={
                <ProtectedRoute>
                  <MyProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/course/:courseId/manage" 
              element={
                <ProtectedRoute>
                  <CourseManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile/:userId" 
              element={
                <ProtectedRoute>
                  <MyProfile />
                </ProtectedRoute>
              } 
            />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App