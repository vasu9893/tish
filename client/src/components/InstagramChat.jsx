import React, { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle, Users, Settings, Plus, Search, MoreVertical } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import api from '../utils/api'

const InstagramChat = () => {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showBulkMessage, setShowBulkMessage] = useState(false)
  const [bulkMessage, setBulkMessage] = useState('')
  const [selectedRecipients, setSelectedRecipients] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation._id)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/instagram/conversations')
      if (response.data.success) {
        setConversations(response.data.data.conversations)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (recipientId) => {
    try {
      setLoading(true)
      const response = await api.get(`/api/instagram/conversations/${recipientId}/messages`)
      if (response.data.success) {
        setMessages(response.data.data.messages)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const response = await api.post('/api/instagram/sendMessage', {
        recipientId: selectedConversation._id,
        message: newMessage,
        messageType: 'text'
      })

      if (response.data.success) {
        setNewMessage('')
        // Add message to local state
        const messageData = {
          _id: response.data.data.messageId,
          content: newMessage,
          sender: 'You',
          timestamp: new Date(),
          isToInstagram: true
        }
        setMessages(prev => [...prev, messageData])
        // Refresh conversations to update last message
        loadConversations()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const sendBulkMessage = async () => {
    if (!bulkMessage.trim() || selectedRecipients.length === 0) return

    try {
      const response = await api.post('/api/instagram/sendBulkMessage', {
        recipientIds: selectedRecipients,
        message: bulkMessage,
        messageType: 'text',
        delayMs: 1000
      })

      if (response.data.success) {
        setBulkMessage('')
        setSelectedRecipients([])
        setShowBulkMessage(false)
        loadConversations()
        alert(`Bulk message sent to ${response.data.data.successful} recipients`)
      }
    } catch (error) {
      console.error('Error sending bulk message:', error)
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.lastMessage?.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv._id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const ConversationItem = ({ conversation, isSelected }) => (
    <div
      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
      }`}
      onClick={() => setSelectedConversation(conversation)}
    >
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>
            {conversation._id.slice(-2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 truncate">
              {conversation._id.slice(-8)}
            </p>
            <span className="text-xs text-gray-500">
              {formatTime(conversation.lastActivity)}
            </span>
          </div>
          <p className="text-sm text-gray-500 truncate">
            {conversation.lastMessage?.content || 'No messages yet'}
          </p>
        </div>
        {conversation.messageCount > 0 && (
          <Badge variant="secondary" className="ml-2">
            {conversation.messageCount}
          </Badge>
        )}
      </div>
    </div>
  )

  const MessageItem = ({ message }) => (
    <div className={`flex ${message.isToInstagram ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          message.isToInstagram
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <p className="text-sm">{message.content}</p>
        <p className={`text-xs mt-1 ${
          message.isToInstagram ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  )

  return (
    <div className="h-full flex">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r bg-white">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Instagram Conversations</h2>
            <Button
              size="sm"
              onClick={() => setShowBulkMessage(!showBulkMessage)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Bulk</span>
            </Button>
          </div>
          
          {showBulkMessage && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <textarea
                placeholder="Enter bulk message..."
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                className="w-full p-2 border rounded text-sm mb-2"
                rows="3"
              />
              <div className="flex flex-wrap gap-1 mb-2">
                {conversations.map(conv => (
                  <Badge
                    key={conv._id}
                    variant={selectedRecipients.includes(conv._id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      if (selectedRecipients.includes(conv._id)) {
                        setSelectedRecipients(prev => prev.filter(id => id !== conv._id))
                      } else {
                        setSelectedRecipients(prev => [...prev, conv._id])
                      }
                    }}
                  >
                    {conv._id.slice(-6)}
                  </Badge>
                ))}
              </div>
              <Button
                size="sm"
                onClick={sendBulkMessage}
                disabled={!bulkMessage.trim() || selectedRecipients.length === 0}
                className="w-full"
              >
                Send to {selectedRecipients.length} recipients
              </Button>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No conversations found</div>
          ) : (
            filteredConversations.map(conversation => (
              <ConversationItem
                key={conversation._id}
                conversation={conversation}
                isSelected={selectedConversation?._id === conversation._id}
              />
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {selectedConversation._id.slice(-2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">Instagram User {selectedConversation._id.slice(-8)}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.messageCount} messages
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              {loading ? (
                <div className="text-center text-gray-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(message => (
                    <MessageItem key={message._id} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="bg-white border-t p-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p>Choose a conversation from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default InstagramChat
