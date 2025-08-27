import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { MessageCircle, Send, Instagram, Clock, User, Bot } from 'lucide-react'

const Chats = ({ user }) => {
  const [conversations, setConversations] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Load sample conversations for demo
    loadSampleConversations()
  }, [])

  const loadSampleConversations = () => {
    const sampleConversations = [
      {
        id: 1,
        username: 'john_doe',
        fullName: 'John Doe',
        lastMessage: 'Hi! I have a question about your product',
        timestamp: '2 min ago',
        unreadCount: 1,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=john_doe`,
        isInstagram: true
      },
      {
        id: 2,
        username: 'sarah_smith',
        fullName: 'Sarah Smith',
        lastMessage: 'Thanks for the help!',
        timestamp: '1 hour ago',
        unreadCount: 0,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=sarah_smith`,
        isInstagram: true
      },
      {
        id: 3,
        username: 'mike_wilson',
        fullName: 'Mike Wilson',
        lastMessage: 'When will my order ship?',
        timestamp: '3 hours ago',
        unreadCount: 2,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=mike_wilson`,
        isInstagram: true
      }
    ]
    setConversations(sampleConversations)
  }

  const loadChatMessages = (conversationId) => {
    // Load sample messages for the selected conversation
    const sampleMessages = [
      {
        id: 1,
        sender: 'john_doe',
        content: 'Hi! I have a question about your product',
        timestamp: '2 min ago',
        isFromUser: false,
        isInstagram: true
      },
      {
        id: 2,
        sender: user.username,
        content: 'Hello! I\'d be happy to help. What would you like to know?',
        timestamp: '1 min ago',
        isFromUser: true,
        isInstagram: false
      },
      {
        id: 3,
        sender: 'john_doe',
        content: 'I\'m interested in the premium plan. What features does it include?',
        timestamp: 'Just now',
        isFromUser: false,
        isInstagram: true
      }
    ]
    setMessages(sampleMessages)
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return

    const message = {
      id: Date.now(),
      sender: user.username,
      content: newMessage,
      timestamp: 'Just now',
      isFromUser: true,
      isInstagram: false
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')

    // Simulate auto-reply after 2 seconds
    setTimeout(() => {
      const autoReply = {
        id: Date.now() + 1,
        sender: 'john_doe',
        content: 'Thanks for your response! I\'ll get back to you soon.',
        timestamp: 'Just now',
        isFromUser: false,
        isInstagram: true
      }
      setMessages(prev => [...prev, autoReply])
    }, 2000)
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
              {conversations.length} active conversations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {conversations.map((conversation) => (
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
                    <AvatarFallback>{conversation.fullName.charAt(0)}</AvatarFallback>
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
            ))}
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
                {messages.map((message) => (
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
                ))}
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
