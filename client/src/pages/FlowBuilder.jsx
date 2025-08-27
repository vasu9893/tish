import React, { useState, useCallback, useRef } from 'react'
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Node,
  Edge
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useNavigate } from 'react-router-dom'
import { saveFlow, getFlow } from '../utils/api'
import MessageNode from '../components/flow/MessageNode'
import ConditionNode from '../components/flow/ConditionNode'
import ActionNode from '../components/flow/ActionNode'

// Custom node types
const nodeTypes = {
  messageNode: MessageNode,
  conditionNode: ConditionNode,
  actionNode: ActionNode
}

const FlowBuilder = () => {
  const navigate = useNavigate()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [flowName, setFlowName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const reactFlowWrapper = useRef(null)

  // Handle edge connections
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // Add new node
  const addNode = (type, position) => {
    const newNode = {
      id: `${type}_${Date.now()}`,
      type: type,
      position: position,
      data: {
        label: type === 'messageNode' ? 'Send Message' : 
               type === 'conditionNode' ? 'Check Condition' : 'Perform Action',
        content: type === 'messageNode' ? 'Hello! How can I help you?' : '',
        keyword: type === 'conditionNode' ? 'help' : '',
        action: type === 'actionNode' ? 'send_api' : ''
      }
    }
    setNodes((nds) => nds.concat(newNode))
  }

  // Save flow
  const handleSaveFlow = async () => {
    if (!flowName.trim()) {
      setMessage('Please enter a flow name')
      return
    }

    if (nodes.length === 0) {
      setMessage('Please add at least one node to save the flow')
      return
    }

    setIsLoading(true)
    try {
      const flowData = {
        name: flowName,
        nodes: nodes,
        edges: edges
      }
      
      const response = await saveFlow(flowData)
      if (response.success) {
        setMessage('Flow saved successfully!')
        setFlowName('')
      } else {
        setMessage('Failed to save flow: ' + response.error)
      }
    } catch (error) {
      setMessage('Error saving flow: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Load flow
  const handleLoadFlow = async () => {
    if (!flowName.trim()) {
      setMessage('Please enter a flow name to load')
      return
    }

    setIsLoading(true)
    try {
      const response = await getFlow(flowName)
      if (response.success) {
        setNodes(response.data.nodes || [])
        setEdges(response.data.edges || [])
        setMessage('Flow loaded successfully!')
      } else {
        setMessage('Failed to load flow: ' + response.error)
      }
    } catch (error) {
      setMessage('Error loading flow: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Add node on drag
  const onDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event) => {
      event.preventDefault()

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const type = event.dataTransfer.getData('application/reactflow')
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top
      }

      addNode(type, position)
    },
    []
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Bot Flow Builder</h1>
            </div>
            
            {/* Flow Name Input */}
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Enter flow name"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleLoadFlow}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Loading...' : 'Load Flow'}
              </button>
              <button
                onClick={handleSaveFlow}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Saving...' : 'Save Flow'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className={`p-4 rounded-lg ${
            message.includes('successfully') 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message}
            <button
              onClick={() => setMessage('')}
              className="float-right text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-140px)]">
        {/* Sidebar with Node Types */}
        <div className="w-64 bg-white shadow-lg border-r">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Node Types</h3>
            
            {/* Message Node */}
            <div
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('application/reactflow', 'messageNode')
              }}
              className="mb-4 p-3 border-2 border-blue-200 rounded-lg cursor-move hover:border-blue-400 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Message Node</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Sends a text message</p>
            </div>

            {/* Condition Node */}
            <div
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('application/reactflow', 'conditionNode')
              }}
              className="mb-4 p-3 border-2 border-yellow-200 rounded-lg cursor-move hover:border-yellow-400 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Condition Node</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Checks if input contains keyword</p>
            </div>

            {/* Action Node */}
            <div
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('application/reactflow', 'actionNode')
              }}
              className="mb-4 p-3 border-2 border-green-200 rounded-lg cursor-move hover:border-green-400 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Action Node</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Performs custom actions</p>
            </div>

            <div className="mt-8 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Instructions</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Drag nodes from sidebar to canvas</li>
                <li>• Connect nodes by dragging from handles</li>
                <li>• Double-click nodes to edit content</li>
                <li>• Save your flow with a name</li>
              </ul>
            </div>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50"
          >
            <Controls />
            <Background />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}

export default FlowBuilder
