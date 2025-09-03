import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { MessageCircle, Instagram, Zap, Shield, Users, Bot } from 'lucide-react'
import { login } from '../utils/api'

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Call real authentication API
      const response = await login(formData)
      
      if (response.data.success) {
        const { token, user } = response.data
        
        // Store token and user data
        onLogin(user, token)
        
        // Navigate to dashboard
        navigate('/dashboard')
      } else {
        setError(response.data.error || 'Login failed. Please try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
      
      if (error.response?.data?.error) {
        setError(error.response.data.error)
      } else if (error.response?.status === 401) {
        setError('Invalid username or password')
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again later.')
      } else if (error.message === 'Network Error') {
        setError('Connection failed. Please check your internet connection.')
      } else {
        setError('Login failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">InstantChat</h1>
          <p className="text-gray-600">Connect, Automate, Engage</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Username or Email
                </label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username or email"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-2 gap-4 text-center">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <Instagram className="h-6 w-6 text-pink-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Instagram Integration</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <Zap className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Automation</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <Shield className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Secure</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Team Ready</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
