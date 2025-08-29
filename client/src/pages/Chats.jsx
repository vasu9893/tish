import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { MessageCircle, Send, Instagram, Clock, User, Bot, RefreshCw } from 'lucide-react'
import api from '../utils/api'

const Chats = ({ user }) => {
  const [conversations, setConversations] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  useEffect(() => {
    // Load Instagram conversations from API
    loadInstagramConversations()
  }, [])

  const loadInstagramConversations = async () => {
    console.log('📚 Loading Instagram Conversations (Chats.jsx)...', {
      timestamp: new Date().toISOString(),
      currentConversations: conversations.length,
      hasToken: !!localStorage.getItem('token')
    })
    
    try {
      setIsRefreshing(true)
      const response = await api.get('/api/instagram/conversations')
      
      console.log('✅ Conversations Loaded Successfully (Chats.jsx):', {
        success: response.data.success,
        totalConversations: response.data.data?.conversations?.length || 0,
        conversations: response.data.data?.conversations || [],
        pagination: {
          total: response.data.data?.total,
          limit: response.data.data?.limit,
          offset: response.data.data?.offset
        }
      })
      
      if (response.data.success && response.data.data && response.data.data.conversations) {
        // Validate conversation data structure (same as InstagramChat)
        const conversations = response.data.data.conversations || []
        const validatedConversations = conversations.map(conv => ({
          id: conv.id || conv.recipientId || 'unknown',
          recipientId: conv.recipientId || conv.id || 'unknown',
          fullName: conv.fullName || conv.sender || `User ${(conv.id || 'unknown').slice(-6)}`,
          avatar: conv.avatar || null,
          timestamp: conv.timestamp || 'Unknown',
          lastMessage: typeof conv.lastMessage === 'string' ? conv.lastMessage : 
                      (conv.lastMessage?.content || 'No messages'),
          messageCount: conv.messageCount || 0,
          unreadCount: conv.unreadCount || 0
        }))
        
        console.log('📝 Validated Conversations (Chats.jsx):', validatedConversations)
        setConversations(validatedConversations)
      } else {
        console.warn('❌ Backend returned success: false (Chats.jsx)')
        setConversations([])
      }
    } catch (error) {
      console.error('❌ Error Loading Instagram Conversations (Chats.jsx):', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        isAuthError: error.response?.status === 401,
        isNotFoundError: error.response?.status === 404,
        timestamp: new Date().toISOString(),
        // Check if we got HTML instead of JSON
        isHtmlResponse: error.message.includes('<!DOCTYPE') || error.message.includes('Unexpected token'),
        fullError: error
      })
      setConversations([])
    } finally {
      setIsRefreshing(false)
    }
  }

  const loadChatMessages = async (conversationId) => {
    console.log('💬 Loading Messages for Conversation (Chats.jsx):', {
      timestamp: new Date().toISOString(),
      conversationId,
      currentMessages: messages.length,
      hasToken: !!localStorage.getItem('token')
    })
    
    try {
      setIsLoadingMessages(true)
      const response = await api.get(`/api/instagram/conversations/${conversationId}/messages`)
      
      console.log('✅ Messages Loaded Successfully (Chats.jsx):', {
        success: response.data.success,
        conversationId: response.data.data?.recipientId,
        totalMessages: response.data.data?.messages?.length || 0,
        messages: response.data.data?.messages || []
      })
      
      if (response.data.success && response.data.data && response.data.data.messages) {
        setMessages(response.data.data.messages)
      } else {
        console.warn('❌ Backend returned success: false for messages (Chats.jsx)')
        setMessages([])
      }
    } catch (error) {
      console.error('❌ Error Loading Messages (Chats.jsx):', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        conversationId,
        isAuthError: error.response?.status === 401,
        isNotFoundError: error.response?.status === 404,
        timestamp: new Date().toISOString(),
        // Check if we got HTML instead of JSON
        isHtmlResponse: error.message.includes('<!DOCTYPE') || error.message.includes('Unexpected token'),
        fullError: error
      })
      setMessages([])
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return

    const message = {
      id: Date.now(),
      sender: user.username,
      content: newMessage,
      timestamp: 'Just now',
      isFromUser: true,
      isInstagram: false
    }

    // Add message to UI immediately for better UX
    setMessages(prev => [...prev, message])
    setNewMessage('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/instagram/send-message', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId: selectedChat.instagramUserId,
          message: newMessage
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          console.log('Message sent successfully via Instagram')
        } else {
          console.error('Failed to send message:', data.error)
        }
      } else {
        console.error('Failed to send message:', response.status)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const selectConversation = (conversation) => {
    setSelectedChat(conversation)
    loadChatMessages(conversation.id)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Instagram className="w-5 h-5 text-pink-600" />
              <span>Instagram DMs</span>
            </CardTitle>
                         <CardDescription>
               {isRefreshing ? (
                 <div className="flex items-center space-x-2">
                   <div className="w-4 h-4 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                   <span>Loading conversations...</span>
                 </div>
               ) : (
                 `${conversations.length} active conversation${conversations.length !== 1 ? 's' : ''}`
               )}
             </CardDescription>
          </CardHeader>
                     <CardContent className="space-y-3">
             {conversations.length > 0 ? (
               conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => selectConversation(conversation)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedChat?.id === conversation.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={conversation.avatar} />
                    <AvatarFallback>{(conversation.fullName || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conversation.fullName}
                      </p>
                      <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <div className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              </div>
               ))
             ) : (
               <div className="text-center py-8 text-gray-500">
                 <Instagram className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                 <p className="text-sm">No Instagram conversations yet</p>
                 <p className="text-xs">Connect your Instagram account to start receiving messages</p>
               </div>
             )}
           </CardContent>
        </Card>
      </div>

      {/* Chat Messages */}
      <div className="lg:col-span-2">
        <Card className="h-full flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={selectedChat.avatar} />
                    <AvatarFallback>{selectedChat.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{selectedChat.fullName}</CardTitle>
                    <CardDescription className="flex items-center space-x-2">
                      <Instagram className="w-4 h-4 text-pink-600" />
                      <span>Instagram DM</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{selectedChat.timestamp}</span>
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center text-gray-500">
                      <div className="w-8 h-8 border-2 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-sm">Loading messages...</p>
                    </div>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isFromUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {message.isInstagram && (
                          <Instagram className="w-3 h-3 text-pink-600" />
                        )}
                        <span className="text-xs opacity-75">
                          {message.isFromUser ? 'You' : message.sender}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-75 mt-1">{message.timestamp}</p>
                                         </div>
                   </div>
                 ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs">Start the conversation by sending a message</p>
                  </div>
                )}
               </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p>Choose a conversation from the list to start chatting</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}

export default Chats
