import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
})

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth functions
export const login = (credentials) => api.post('/api/auth/login', credentials)
export const register = (userData) => api.post('/api/auth/register', userData)

// Message functions
export const sendMessage = (messageData) => api.post('/api/messages', messageData)
export const getMessages = () => api.get('/api/messages')

// Instagram functions
export const getInstagramStatus = () => api.get('/api/instagram/public/status') // Using public endpoint for testing
export const connectInstagram = () => api.get('/api/instagram/auth/instagram')
export const disconnectInstagram = () => api.delete('/api/instagram/disconnect')
export const sendInstagramMessage = (messageData) => api.post('/api/instagram/sendMessage', messageData)

// Public Instagram endpoints for testing (no authentication required)
export const getInstagramStatusPublic = () => api.get('/api/instagram/public/status')
export const getInstagramConversationsPublic = () => api.get('/api/instagram/public/conversations')

// Flow functions
export const saveFlow = (flowData) => api.post('/api/flow/save', flowData)
export const getFlow = (flowName) => api.get(`/api/flow/get/${flowName}`)
export const getUserFlows = () => api.get('/api/flow/user')
export const deleteFlow = (flowId) => api.delete(`/api/flow/${flowId}`)

export default api
