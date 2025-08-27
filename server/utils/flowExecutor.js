const axios = require('axios')

class FlowExecutor {
  constructor() {
    this.variables = new Map()
    this.executionHistory = []
  }

  // Execute a flow with given input
  async executeFlow(flow, input, context = {}) {
    try {
      this.variables.clear()
      this.executionHistory = []
      
      // Set input variables
      this.variables.set('input', input)
      this.variables.set('timestamp', new Date().toISOString())
      this.variables.set('userId', context.userId || 'unknown')
      
      // Find start node (node with no incoming edges)
      const startNode = this.findStartNode(flow.nodes, flow.edges)
      
      if (!startNode) {
        throw new Error('No start node found in flow')
      }

      // Execute flow starting from start node
      const result = await this.executeNode(startNode, flow)
      
      return {
        success: true,
        result,
        variables: Object.fromEntries(this.variables),
        executionHistory: this.executionHistory
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
  async executeNode(node, flow) {
    this.executionHistory.push({
      nodeId: node.id,
      nodeType: node.type,
      timestamp: new Date().toISOString(),
      variables: Object.fromEntries(this.variables)
    })

    switch (node.type) {
      case 'messageNode':
        return await this.executeMessageNode(node, flow)
      
      case 'conditionNode':
        return await this.executeConditionNode(node, flow)
      
      case 'actionNode':
        return await this.executeActionNode(node, flow)
      
      default:
        throw new Error(`Unknown node type: ${node.type}`)
    }
  }

  // Execute message node
  async executeMessageNode(node, flow) {
    const message = this.interpolateVariables(node.data.content || '')
    
    // Find next node
    const nextNode = this.findNextNode(node.id, flow.edges)
    
    if (nextNode) {
      return await this.executeNode(nextNode, flow)
    }
    
    return { type: 'message', content: message, action: 'send' }
  }

  // Execute condition node
  async executeConditionNode(node, flow) {
    const input = this.variables.get('input') || ''
    const keyword = node.data.keyword || ''
    
    const conditionMet = input.toLowerCase().includes(keyword.toLowerCase())
    
    // Find next node based on condition result
    const nextNode = this.findNextNodeByCondition(node.id, flow.edges, conditionMet ? 'true' : 'false')
    
    if (nextNode) {
      return await this.executeNode(nextNode, flow)
    }
    
    return { type: 'condition', result: conditionMet, keyword }
  }

  // Execute action node
  async executeActionNode(node, flow) {
    const action = node.data.action || 'send_api'
    const params = node.data.actionParams || ''
    
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
    const nextNode = this.findNextNode(node.id, flow.edges)
    
    if (nextNode) {
      return await this.executeNode(nextNode, flow)
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
  async executeSetVariableAction(params) {
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
  async executeWaitAction(params) {
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
  findNextNode(nodeId, edges) {
    const edge = edges.find(e => e.source === nodeId)
    return edge ? this.findNodeById(edge.target) : null
  }

  // Find next node based on condition result
  findNextNodeByCondition(nodeId, edges, conditionResult) {
    const edge = edges.find(e => e.source === nodeId && e.sourceHandle === conditionResult)
    return edge ? this.findNodeById(edge.target) : null
  }

  // Find node by ID
  findNodeById(nodeId) {
    // This would need to be passed from the flow execution context
    return null // Placeholder
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
}

module.exports = FlowExecutor
