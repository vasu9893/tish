import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ConnectInstagram from './pages/ConnectInstagram'
import Dashboard from './pages/Dashboard'
import FlowBuilder from './pages/FlowBuilder'
import OAuthCallback from './components/OAuthCallback'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      setIsAuthenticated(true)
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setIsAuthenticated(true)
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setUser(null)
  }

  return (
    <div className="App">
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <Login onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/signup" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <Signup onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/connect-instagram" 
          element={
            isAuthenticated ? 
            <ConnectInstagram user={user} onLogout={handleLogout} /> : 
            <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/oauth-callback" 
          element={
            isAuthenticated ? 
            <OAuthCallback /> : 
            <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? 
            <Dashboard user={user} onLogout={handleLogout} /> : 
            <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/flow-builder" 
          element={
            isAuthenticated ? 
            <FlowBuilder user={user} onLogout={handleLogout} /> : 
            <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </div>
  )
}

export default App
