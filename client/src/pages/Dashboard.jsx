import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'
import MessageInput from '../components/MessageInput'
import socketService from '../utils/socket'
import axios from 'axios'

const Dashboard = ({ user, onLogout }) => {
  const [messages, setMessages] = useState([])
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [instagramStatus, setInstagramStatus] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Connect to socket when component mounts
    const token = localStorage.getItem('token')
    const socketInstance = socketService.connect(token)
    setSocket(socketInstance)

    // Listen for incoming messages
    socketService.on('message', (newMessage) => {
      setMessages(prev => [...prev, newMessage])
    })

    // Listen for message history
    socketService.on('messageHistory', (history) => {
      setMessages(history)
    })

    // Listen for connection status
    socketService.on('connect', () => {
      setIsConnected(true)
    })

    socketService.on('disconnect', () => {
      setIsConnected(false)
    })

    // Request message history
    socketService.emit('getMessageHistory')

    // Check Instagram connection status
    checkInstagramStatus()

    return () => {
      socketService.disconnect()
    }
  }, [])

  const checkInstagramStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/instagram/status', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        setInstagramStatus(response.data.connected)
      }
    } catch (error) {
      console.error('Error checking Instagram status:', error)
      setInstagramStatus(false)
    }
  }

  const goToConnectInstagram = () => {
    navigate('/connect-instagram')
  }

  const handleSendMessage = (content) => {
    if (!content.trim()) return

    const newMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: user.username,
      timestamp: new Date().toISOString(),
      userId: user.id
    }

    // Send message to server - don't add locally to prevent duplicates
    socketService.emit('sendMessage', newMessage)
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar user={user} onLogout={onLogout} isConnected={isConnected} />
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <h1 className="text-xl font-semibold text-gray-900">General Chat</h1>
              <span className="text-sm text-gray-500">• Real-time messaging</span>
              
              {/* Instagram Status */}
              <div className="flex items-center space-x-2 ml-4">
                <div className={`w-2 h-2 rounded-full ${instagramStatus ? 'bg-pink-500' : 'bg-gray-400'}`}></div>
                <span className={`text-sm ${instagramStatus ? 'text-pink-600' : 'text-gray-500'}`}>
                  {instagramStatus ? 'Instagram Connected' : 'Instagram Not Connected'}
                </span>
                {!instagramStatus && (
                  <button
                    onClick={goToConnectInstagram}
                    className="text-xs px-2 py-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-full hover:from-pink-600 hover:to-orange-600 transition-all"
                  >
                    Connect
                  </button>
                )}
              </div>
              
              {/* Flow Builder Link */}
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => navigate('/flow-builder')}
                  className="text-xs px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:from-blue-600 hover:to-purple-600 transition-all flex items-center space-x-1"
                >
                  <span>🤖</span>
                  <span>Flow Builder</span>
                </button>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <ChatWindow messages={messages} currentUser={user} />
        
        {/* Message Input */}
        <MessageInput onSendMessage={handleSendMessage} isConnected={isConnected} />
      </div>
    </div>
  )
}

export default Dashboard
