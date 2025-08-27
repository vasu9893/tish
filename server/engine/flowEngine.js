const axios = require('axios')
const Flow = require('../models/Flow')
const { sendInstagramMessage } = require('../utils/metaApi')

class FlowEngine {
  constructor() {
    this.variables = new Map()
    this.executionHistory = []
    this.maxExecutionSteps = 100 // Prevent infinite loops
  }

  // Main function to run automation for a user
  async runAutomation(userId, incomingMessage) {
    try {
      console.log(`🚀 Starting automation for user ${userId}`)
      
      // Get user's active flows
      const activeFlows = await Flow.find({ userId, isActive: true })
      
      if (activeFlows.length === 0) {
        console.log(`No active flows found for user ${userId}`)
        return { success: false, message: 'No active flows found' }
      }

      // Run each active flow
      const results = []
      for (const flow of activeFlows) {
        try {
          const result = await this.executeFlow(flow.flowJson, incomingMessage, { userId, flowId: flow._id })
          results.push({
            flowId: flow._id,
            flowName: flow.name,
            result
          })
        } catch (error) {
          console.error(`Error executing flow ${flow.name}:`, error)
          results.push({
            flowId: flow._id,
            flowName: flow.name,
            error: error.message
          })
        }
      }

      return {
        success: true,
        message: `Executed ${activeFlows.length} flows`,
        results
      }

    } catch (error) {
      console.error('Flow engine error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Execute a specific flow
  async executeFlow(flow, input, context = {}) {
    try {
      this.variables.clear()
      this.executionHistory = []
      
      // Set initial variables
      this.variables.set('input', input)
      this.variables.set('timestamp', new Date().toISOString())
      this.variables.set('userId', context.userId || 'unknown')
      this.variables.set('flowId', context.flowId || 'unknown')
      
      // Find start node (node with no incoming edges)
      const startNode = this.findStartNode(flow.nodes, flow.edges)
      
      if (!startNode) {
        throw new Error('No start node found in flow')
      }

      console.log(`📍 Starting execution from node: ${startNode.id} (${startNode.type})`)
      
      // Execute flow starting from start node
      const result = await this.executeNode(startNode, flow, context)
      
      return {
        success: true,
        result,
        variables: Object.fromEntries(this.variables),
        executionHistory: this.executionHistory,
        stepsExecuted: this.executionHistory.length
      }

    } catch (error) {
      console.error('Flow execution error:', error)
      return {
        success: false,
        error: error.message,
        variables: Object.fromEntries(this.variables),
        executionHistory: this.executionHistory
      }
    }
  }

  // Find the start node (no incoming edges)
  findStartNode(nodes, edges) {
    const nodesWithIncoming = new Set()
    
    edges.forEach(edge => {
      nodesWithIncoming.add(edge.target)
    })
    
    return nodes.find(node => !nodesWithIncoming.has(node.id))
  }

  // Execute a specific node
  async executeNode(node, flow, context) {
    // Prevent infinite loops
    if (this.executionHistory.length >= this.maxExecutionSteps) {
      throw new Error(`Maximum execution steps (${this.maxExecutionSteps}) exceeded`)
    }

    this.executionHistory.push({
      nodeId: node.id,
      nodeType: node.type,
      timestamp: new Date().toISOString(),
      variables: Object.fromEntries(this.variables)
    })

    console.log(`⚡ Executing node: ${node.id} (${node.type})`)

    switch (node.type) {
      case 'messageNode':
        return await this.executeMessageNode(node, flow, context)
      
      case 'conditionNode':
        return await this.executeConditionNode(node, flow, context)
      
      case 'actionNode':
        return await this.executeActionNode(node, flow, context)
      
      default:
        throw new Error(`Unknown node type: ${node.type}`)
    }
  }

  // Execute message node
  async executeMessageNode(node, flow, context) {
    const message = this.interpolateVariables(node.data.content || '')
    
    console.log(`💬 Message node: ${message}`)
    
    // Send message via Instagram API if we have the context
    if (context.userId && node.data.sendToInstagram) {
      try {
        // This would need the recipient's Instagram ID from the context
        // For now, we'll just log it
        console.log(`📱 Would send Instagram message: ${message}`)
        
        // TODO: Implement actual Instagram message sending
        // await sendInstagramMessage(recipientId, message)
        
      } catch (error) {
        console.error('Error sending Instagram message:', error)
      }
    }
    
    // Find next node
    const nextNode = this.findNextNode(node.id, flow.edges, flow.nodes)
    
    if (nextNode) {
      return await this.executeNode(nextNode, flow, context)
    }
    
    return { type: 'message', content: message, action: 'sent' }
  }

  // Execute condition node
  async executeConditionNode(node, flow, context) {
    const input = this.variables.get('input') || ''
    const keyword = node.data.keyword || ''
    
    const conditionMet = input.toLowerCase().includes(keyword.toLowerCase())
    
    console.log(`🔍 Condition node: "${keyword}" in "${input}" = ${conditionMet}`)
    
    // Find next node based on condition result
    const nextNode = this.findNextNodeByCondition(node.id, flow.edges, flow.nodes, conditionMet ? 'true' : 'false')
    
    if (nextNode) {
      return await this.executeNode(nextNode, flow, context)
    }
    
    return { type: 'condition', result: conditionMet, keyword }
  }

  // Execute action node
  async executeActionNode(node, flow, context) {
    const action = node.data.action || 'send_api'
    const params = node.data.actionParams || ''
    
    console.log(`⚙️ Action node: ${action} with params: ${params}`)
    
    let result
    
    try {
      switch (action) {
        case 'send_api':
          result = await this.executeApiAction(params)
          break
          
        case 'add_tag':
          result = await this.executeTagAction('add', params)
          break
          
        case 'remove_tag':
          result = await this.executeTagAction('remove', params)
          break
          
        case 'set_variable':
          result = await this.executeSetVariableAction(params)
          break
          
        case 'wait':
          result = await this.executeWaitAction(params)
          break
          
        default:
          result = { type: 'unknown_action', action, params }
      }
    } catch (error) {
      result = { type: 'action_error', action, error: error.message }
    }
    
    // Find next node
    const nextNode = this.findNextNode(node.id, flow.edges, flow.nodes)
    
    if (nextNode) {
      return await this.executeNode(nextNode, flow, context)
    }
    
    return result
  }

  // Execute API action
  async executeApiAction(params) {
    try {
      const response = await axios.post(params, {
        variables: Object.fromEntries(this.variables),
        timestamp: new Date().toISOString()
      })
      
      return {
        type: 'api_response',
        success: true,
        data: response.data,
        status: response.status
      }
    } catch (error) {
      return {
        type: 'api_error',
        success: false,
        error: error.message
      }
    }
  }

  // Execute tag action
  async executeTagAction(action, tagName) {
    // This would integrate with your user management system
    return {
      type: 'tag_action',
      action,
      tag: tagName,
      success: true,
      message: `Tag ${action === 'add' ? 'added' : 'removed'}: ${tagName}`
    }
  }

  // Execute set variable action
  executeSetVariableAction(params) {
    try {
      const [varName, varValue] = params.split('=').map(s => s.trim())
      this.variables.set(varName, varValue)
      
      return {
        type: 'variable_set',
        variable: varName,
        value: varValue,
        success: true
      }
    } catch (error) {
      return {
        type: 'variable_error',
        success: false,
        error: 'Invalid variable format. Use: variable_name=value'
      }
    }
  }

  // Execute wait action
  executeWaitAction(params) {
    const delay = parseInt(params) || 1000
    
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          type: 'wait',
          delay,
          success: true
        })
      }, delay)
    })
  }

  // Find next node in the flow
  findNextNode(nodeId, edges, nodes) {
    const edge = edges.find(e => e.source === nodeId)
    return edge ? this.findNodeById(edge.target, nodes) : null
  }

  // Find next node based on condition result
  findNextNodeByCondition(nodeId, edges, nodes, conditionResult) {
    const edge = edges.find(e => e.source === nodeId && e.sourceHandle === conditionResult)
    return edge ? this.findNodeById(edge.target, nodes) : null
  }

  // Find node by ID
  findNodeById(nodeId, nodes) {
    return nodes.find(node => node.id === nodeId)
  }

  // Interpolate variables in strings
  interpolateVariables(text) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return this.variables.get(varName) || match
    })
  }

  // Get execution summary
  getExecutionSummary() {
    return {
      totalNodes: this.executionHistory.length,
      variables: Object.fromEntries(this.variables),
      lastExecuted: this.executionHistory[this.executionHistory.length - 1]?.timestamp
    }
  }

  // Test flow execution with sample input
  async testFlow(flow, testInput = 'Hello, this is a test message') {
    return await this.executeFlow(flow, testInput, { userId: 'test_user', flowId: 'test_flow' })
  }
}

module.exports = FlowEngine
