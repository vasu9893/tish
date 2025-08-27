import React, { useState, useCallback } from 'react'
import { Handle, Position } from 'reactflow'

const ActionNode = ({ data, isConnectable }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [action, setAction] = useState(data.action || 'send_api')
  const [actionParams, setActionParams] = useState(data.actionParams || '')

  const actionTypes = [
    { value: 'send_api', label: 'Send API Request', icon: '🌐' },
    { value: 'add_tag', label: 'Add User Tag', icon: '🏷️' },
    { value: 'remove_tag', label: 'Remove User Tag', icon: '❌' },
    { value: 'set_variable', label: 'Set Variable', icon: '📝' },
    { value: 'wait', label: 'Wait/Delay', icon: '⏱️' }
  ]

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true)
  }, [])

  const handleSave = useCallback(() => {
    data.action = action
    data.actionParams = actionParams
    setIsEditing(false)
  }, [data, action, actionParams])

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      setIsEditing(false)
      setAction(data.action || 'send_api')
      setActionParams(data.actionParams || '')
    }
  }, [handleSave, data.action, data.actionParams])

  const getActionDisplay = () => {
    const actionType = actionTypes.find(t => t.value === action)
    return actionType ? actionType.label : 'Custom Action'
  }

  const getActionIcon = () => {
    const actionType = actionTypes.find(t => t.value === action)
    return actionType ? actionType.icon : '⚡'
  }

  return (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-white border-2 border-green-200 min-w-[200px]">
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-500"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">Action</span>
        </div>
        <div className="text-xs text-gray-500">{getActionIcon()}</div>
      </div>

      {/* Action Content */}
      {isEditing ? (
        <div className="space-y-3">
          {/* Action Type Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Action Type:
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {actionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Parameters */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Parameters:
            </label>
            <textarea
              value={actionParams}
              onChange={(e) => setActionParams(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={2}
              placeholder="Enter action parameters (e.g., API URL, tag name, variable value)"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setAction(data.action || 'send_api')
                setActionParams(data.actionParams || '')
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
          className="cursor-pointer p-2 bg-green-50 rounded border border-green-200 hover:border-green-300 transition-colors"
        >
          <p className="text-sm text-gray-700 font-medium">
            {getActionDisplay()}
          </p>
          {actionParams && (
            <p className="text-xs text-gray-600 mt-1 break-words">
              {actionParams}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">Double-click to edit</p>
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-green-500"
      />
    </div>
  )
}

export default ActionNode
