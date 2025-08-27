const express = require('express')
const router = express.Router()
const Flow = require('../models/Flow')
const authMiddleware = require('../middleware/authMiddleware')

// Save a new flow or update existing one
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { name, nodes, edges, description, tags } = req.body
    const userId = req.user.id

    if (!name || !nodes) {
      return res.status(400).json({
        success: false,
        error: 'Flow name and nodes are required'
      })
    }

    // Check if flow with this name already exists for this user
    const existingFlow = await Flow.findOne({ userId, name })

    if (existingFlow) {
      // Update existing flow
      existingFlow.flowJson = { nodes, edges }
      existingFlow.description = description || existingFlow.description
      existingFlow.tags = tags || existingFlow.tags
      existingFlow.updatedAt = new Date()

      await existingFlow.save()

      res.json({
        success: true,
        message: 'Flow updated successfully',
        data: {
          id: existingFlow._id,
          name: existingFlow.name,
          updatedAt: existingFlow.updatedAt
        }
      })
    } else {
      // Create new flow
      const newFlow = new Flow({
        userId,
        name,
        flowJson: { nodes, edges },
        description: description || '',
        tags: tags || []
      })

      await newFlow.save()

      res.json({
        success: true,
        message: 'Flow saved successfully',
        data: {
          id: newFlow._id,
          name: newFlow.name,
          createdAt: newFlow.createdAt
        }
      })
    }

  } catch (error) {
    console.error('Save flow error:', error)
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'A flow with this name already exists'
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to save flow'
    })
  }
})

// Get a specific flow by name
router.get('/get/:name', authMiddleware, async (req, res) => {
  try {
    const { name } = req.params
    const userId = req.user.id

    const flow = await Flow.findOne({ userId, name })

    if (!flow) {
      return res.status(404).json({
        success: false,
        error: 'Flow not found'
      })
    }

    res.json({
      success: true,
      data: {
        id: flow._id,
        name: flow.name,
        nodes: flow.flowJson.nodes || [],
        edges: flow.flowJson.edges || [],
        description: flow.description,
        tags: flow.tags,
        isActive: flow.isActive,
        createdAt: flow.createdAt,
        updatedAt: flow.updatedAt
      }
    })

  } catch (error) {
    console.error('Get flow error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get flow'
    })
  }
})

// Get all flows for the current user
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const flows = await Flow.findByUser(userId)

    const flowSummaries = flows.map(flow => flow.getSummary())

    res.json({
      success: true,
      data: flowSummaries
    })

  } catch (error) {
    console.error('Get user flows error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get user flows'
    })
  }
})

// Delete a flow
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const flow = await Flow.findOne({ _id: id, userId })

    if (!flow) {
      return res.status(404).json({
        success: false,
        error: 'Flow not found'
      })
    }

    await Flow.findByIdAndDelete(id)

    res.json({
      success: true,
      message: 'Flow deleted successfully'
    })

  } catch (error) {
    console.error('Delete flow error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete flow'
    })
  }
})

// Toggle flow active status
router.patch('/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const flow = await Flow.findOne({ _id: id, userId })

    if (!flow) {
      return res.status(404).json({
        success: false,
        error: 'Flow not found'
      })
    }

    flow.isActive = !flow.isActive
    flow.updatedAt = new Date()
    await flow.save()

    res.json({
      success: true,
      message: `Flow ${flow.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: flow._id,
        name: flow.name,
        isActive: flow.isActive
      }
    })

  } catch (error) {
    console.error('Toggle flow error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to toggle flow status'
    })
  }
})

// Update flow metadata (name, description, tags)
router.patch('/:id/metadata', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, tags } = req.body
    const userId = req.user.id

    const flow = await Flow.findOne({ _id: id, userId })

    if (!flow) {
      return res.status(404).json({
        success: false,
        error: 'Flow not found'
      })
    }

    // Check if new name conflicts with existing flow
    if (name && name !== flow.name) {
      const nameConflict = await Flow.findOne({ userId, name })
      if (nameConflict) {
        return res.status(400).json({
          success: false,
          error: 'A flow with this name already exists'
        })
      }
    }

    // Update fields
    if (name) flow.name = name
    if (description !== undefined) flow.description = description
    if (tags) flow.tags = tags
    flow.updatedAt = new Date()

    await flow.save()

    res.json({
      success: true,
      message: 'Flow metadata updated successfully',
      data: {
        id: flow._id,
        name: flow.name,
        description: flow.description,
        tags: flow.tags,
        updatedAt: flow.updatedAt
      }
    })

  } catch (error) {
    console.error('Update flow metadata error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update flow metadata'
    })
  }
})

// Test flow execution
router.post('/:id/test', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { input } = req.body
    const userId = req.user.id

    const flow = await Flow.findOne({ _id: id, userId })

    if (!flow) {
      return res.status(404).json({
        success: false,
        error: 'Flow not found'
      })
    }

    if (!flow.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Cannot test inactive flow'
      })
    }

    // Execute the flow
    const FlowExecutor = require('../utils/flowExecutor')
    const executor = new FlowExecutor()
    
    // Fix the findNodeById method by passing the flow context
    executor.findNodeById = (nodeId) => {
      return flow.flowJson.nodes.find(node => node.id === nodeId)
    }

    const result = await executor.executeFlow(flow.flowJson, input, { userId })

    res.json({
      success: true,
      message: 'Flow test executed successfully',
      data: result
    })

  } catch (error) {
    console.error('Test flow error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to test flow'
    })
  }
})

module.exports = router
