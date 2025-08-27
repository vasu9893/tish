import React, { useState, useCallback } from 'react'
import { Handle, Position } from 'reactflow'

const ConditionNode = ({ data, isConnectable }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [keyword, setKeyword] = useState(data.keyword || 'help')

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true)
  }, [])

  const handleSave = useCallback(() => {
    data.keyword = keyword
    setIsEditing(false)
  }, [data, keyword])

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      setIsEditing(false)
      setKeyword(data.keyword || 'help')
    }
  }, [handleSave, data.keyword])

  return (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-white border-2 border-yellow-200 min-w-[200px]">
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-yellow-500"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">Condition</span>
        </div>
        <div className="text-xs text-gray-500">🔍</div>
      </div>

      {/* Condition Content */}
      {isEditing ? (
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Keyword to check:
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleSave}
              className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Enter keyword"
              autoFocus
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setKeyword(data.keyword || 'help')
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
          className="cursor-pointer p-2 bg-yellow-50 rounded border border-yellow-200 hover:border-yellow-300 transition-colors"
        >
          <p className="text-sm text-gray-700">
            Check if input contains: <span className="font-semibold text-yellow-700">"{keyword}"</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">Double-click to edit</p>
        </div>
      )}

      {/* Output Handles - True and False */}
      <div className="flex justify-between mt-3">
        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          style={{ left: '25%' }}
          isConnectable={isConnectable}
          className="w-3 h-3 bg-green-500"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          style={{ left: '75%' }}
          isConnectable={isConnectable}
          className="w-3 h-3 bg-red-500"
        />
      </div>

      {/* Handle Labels */}
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span className="text-green-600 font-medium">True</span>
        <span className="text-red-600 font-medium">False</span>
      </div>
    </div>
  )
}

export default ConditionNode
