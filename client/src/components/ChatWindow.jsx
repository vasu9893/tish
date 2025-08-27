import React, { useEffect, useRef } from 'react'

const ChatWindow = ({ messages, currentUser }) => {
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const isOwnMessage = (message) => {
    return message.userId === currentUser.id
  }

  const shouldShowDate = (message, index) => {
    if (index === 0) return true
    
    const currentDate = new Date(message.timestamp).toDateString()
    const previousDate = new Date(messages[index - 1].timestamp).toDateString()
    
    return currentDate !== previousDate
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Welcome to InstantChat!</h3>
          <p className="text-gray-600 mb-4">
            This is your general chat room. Start a conversation by sending your first message below.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Open multiple browser tabs to test real-time messaging between different users.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="space-y-6 max-w-4xl mx-auto">
        {messages.map((message, index) => (
          <div key={message.id}>
            {/* Date Separator */}
            {shouldShowDate(message, index) && (
              <div className="flex items-center justify-center my-6">
                <div className="bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                  <span className="text-sm font-medium text-gray-600">
                    {formatDate(message.timestamp)}
                  </span>
                </div>
              </div>
            )}
            
            {/* Message */}
            <div className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md ${isOwnMessage(message) ? 'order-2' : 'order-1'}`}>
                {!isOwnMessage(message) && (
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {message.sender.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">
                        {message.sender}
                      </span>
                      {message.source === 'instagram' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-pink-100 to-orange-100 text-pink-800 border border-pink-200">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          Instagram
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <div
                  className={`px-4 py-3 rounded-2xl shadow-sm ${
                    isOwnMessage(message)
                      ? message.isToInstagram 
                        ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white' // Instagram outbound
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' // Regular outbound
                      : message.source === 'instagram'
                        ? 'bg-gradient-to-r from-pink-100 to-orange-100 text-gray-900 border-2 border-pink-200' // Instagram inbound
                        : 'bg-white text-gray-900 border border-gray-200' // Regular inbound
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
                
                <div className={`text-xs mt-2 ${
                  isOwnMessage(message) 
                    ? message.isToInstagram 
                      ? 'text-right text-pink-100' // Instagram outbound
                      : 'text-right text-blue-100' // Regular outbound
                    : message.source === 'instagram'
                      ? 'text-left text-pink-600' // Instagram inbound
                      : 'text-left text-gray-500' // Regular inbound
                }`}>
                  {formatTime(message.timestamp)}
                  {message.source === 'instagram' && (
                    <span className="ml-2">• via Instagram</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default ChatWindow
