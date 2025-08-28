import axios from 'axios'

// Debug logging for API configuration
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  const fallbackUrl = 'http://localhost:5000'
  const finalUrl = envUrl || fallbackUrl
  
  console.log('🔧 API Configuration Debug:', {
    'VITE_API_URL from env': envUrl,
    'Fallback URL': fallbackUrl,
    'Final API URL': finalUrl,
    'Environment': import.meta.env.MODE,
    'Is Development': import.meta.env.DEV,
    'Is Production': import.meta.env.PROD
  })
  
  return finalUrl
}

const api = axios.create({
  baseURL: getApiUrl()
})

// Add request interceptor for debugging
api.interceptors.request.use((config) => {
  console.log('🚀 API Request:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    fullUrl: `${config.baseURL}${config.url}`,
    headers: config.headers,
    data: config.data,
    params: config.query
  })
  
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log('🔑 Auth token added:', token.substring(0, 20) + '...')
  } else {
    console.log('⚠️ No auth token found in localStorage')
  }
  
  return config
})

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response Success:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data,
      headers: response.headers
    })
    return response
  },
  (error) => {
    console.error('❌ API Response Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      headers: error.response?.headers,
      isNetworkError: !error.response,
      isAuthError: error.response?.status === 401,
      isNotFoundError: error.response?.status === 404
    })
    return Promise.reject(error)
  }
)

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

// Instagram functions with enhanced debugging
export const getInstagramStatus = () => {
  console.log('📱 Instagram Status Request:', {
    timestamp: new Date().toISOString(),
    endpoint: '/api/instagram/status',
    requiresAuth: true
  })
  return api.get('/api/instagram/status')
}

export const connectInstagram = () => {
  console.log('🔗 Instagram Connect Request:', {
    timestamp: new Date().toISOString(),
    endpoint: '/api/instagram/auth/instagram',
    requiresAuth: false,
    willRedirect: true
  })
  return api.get('/api/instagram/auth/instagram')
}

export const disconnectInstagram = () => {
  console.log('🔌 Instagram Disconnect Request:', {
    timestamp: new Date().toISOString(),
    endpoint: '/api/instagram/disconnect',
    requiresAuth: true
  })
  return api.delete('/api/instagram/disconnect')
}

export const sendInstagramMessage = (messageData) => {
  console.log('💬 Instagram Send Message Request:', {
    timestamp: new Date().toISOString(),
    endpoint: '/api/instagram/sendMessage',
    requiresAuth: true,
    messageData: {
      recipientId: messageData.recipientId,
      message: messageData.message?.substring(0, 50) + (messageData.message?.length > 50 ? '...' : ''),
      messageType: messageData.messageType,
      threadId: messageData.threadId
    }
  })
  return api.post('/api/instagram/sendMessage', messageData)
}

// Flow functions
export const saveFlow = (flowData) => api.post('/api/flow/save', flowData)
export const getFlow = (flowName) => api.get(`/api/flow/get/${flowName}`)
export const getUserFlows = () => api.get('/api/flow/user')
export const deleteFlow = (flowId) => api.delete(`/api/flow/${flowId}`)

export default api
