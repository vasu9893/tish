import React, { useState, useCallback } from 'react'
import { Handle, Position } from 'reactflow'

const MessageNode = ({ data, isConnectable }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(data.content || 'Hello! How can I help you?')

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true)
  }, [])

  const handleSave = useCallback(() => {
    data.content = content
    setIsEditing(false)
  }, [data, content])

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      setIsEditing(false)
      setContent(data.content || 'Hello! How can I help you?')
    }
  }, [handleSave, data.content])

  return (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-white border-2 border-blue-200 min-w-[200px]">
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">Message</span>
        </div>
        <div className="text-xs text-gray-500">📤</div>
      </div>

      {/* Message Content */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={handleSave}
            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            autoFocus
          />
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setContent(data.content || 'Hello! How can I help you?')
              }}
              className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          onDoubleClick={handleDoubleClick}
          className="cursor-pointer p-2 bg-blue-50 rounded border border-blue-200 hover:border-blue-300 transition-colors"
        >
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {content || 'Double-click to edit message'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Double-click to edit</p>
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500"
      />
    </div>
  )
}

export default MessageNode
