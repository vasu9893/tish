import React, { useState } from 'react'

const MessageInput = ({ onSendMessage, isConnected }) => {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() && isConnected) {
      onSendMessage(message)
      setMessage('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleInputChange = (e) => {
    setMessage(e.target.value)
    setIsTyping(e.target.value.length > 0)
  }

  return (
    <div className="bg-white border-t border-gray-200 p-6">
      {/* Connection Status */}
      {!isConnected && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-red-700 font-medium">
              Connection lost. Trying to reconnect...
            </span>
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? "Type your message..." : "Connecting..."}
            disabled={!isConnected}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows="1"
            style={{ minHeight: '56px', maxHeight: '120px' }}
          />
          
          {/* Character Count */}
          {isTyping && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {message.length}/1000
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between">
          {/* Send Button */}
          <button
            type="submit"
            disabled={!message.trim() || !isConnected}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>Send Message</span>
          </button>

          {/* Instructions */}
          <div className="text-sm text-gray-500">
            <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
            <span className="sm:hidden">Tap to send</span>
          </div>
        </div>
      </form>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-blue-800">
              <strong>Real-time messaging:</strong> Your messages appear instantly for all connected users. 
              Open multiple browser tabs to test the experience!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessageInput
