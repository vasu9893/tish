# Phase 3: Bot Flow Builder with React Flow

## 🎯 Overview

The Bot Flow Builder is a visual tool that allows users to create automated conversation flows using a drag-and-drop interface. Users can design complex bot behaviors by connecting different types of nodes.

## 🏗️ Architecture

### Frontend Components
- **FlowBuilder.jsx** - Main flow builder page
- **MessageNode.jsx** - Node for sending text messages
- **ConditionNode.jsx** - Node for conditional logic
- **ActionNode.jsx** - Node for performing actions

### Backend Components
- **Flow.js** - MongoDB model for storing flows
- **flow.js** - API routes for flow management
- **flowExecutor.js** - Engine for executing flows

## 🚀 Features

### 1. Node Types

#### Message Node
- **Purpose**: Sends text messages to users
- **Features**: 
  - Editable message content (double-click to edit)
  - Variable interpolation support (`{{variable_name}}`)
  - Single input, single output

#### Condition Node
- **Purpose**: Checks if user input contains specific keywords
- **Features**:
  - Configurable keyword matching
  - Two outputs: "True" and "False"
  - Case-insensitive matching

#### Action Node
- **Purpose**: Performs automated actions
- **Action Types**:
  - Send API Request
  - Add/Remove User Tags
  - Set Variables
  - Wait/Delay
  - Custom Actions

### 2. Flow Management

#### Save Flow
- Stores flow configuration as JSON
- Supports flow updates (overwrites existing flows with same name)
- Includes metadata: description, tags, active status

#### Load Flow
- Retrieves saved flows by name
- Restores complete flow state (nodes + edges)
- User-specific flow isolation

#### Flow Organization
- Unique flow names per user
- Tag-based categorization
- Active/inactive status management

### 3. Visual Editor

#### Drag & Drop
- Drag nodes from sidebar to canvas
- Connect nodes by dragging from handles
- Visual feedback during interactions

#### Node Editing
- Double-click nodes to edit content
- Real-time validation
- Keyboard shortcuts (Enter to save, Escape to cancel)

#### Canvas Features
- Zoom and pan controls
- Mini-map for navigation
- Grid background
- Node selection and movement

## 🔧 Technical Implementation

### React Flow Integration
```jsx
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap
} from 'reactflow'
```

### Node State Management
```jsx
const [nodes, setNodes, onNodesChange] = useNodesState([])
const [edges, setEdges, onEdgesChange] = useEdgesState([])
```

### Custom Node Components
Each node type extends React Flow's base functionality with custom UI and behavior.

### Flow Execution Engine
The backend includes a `FlowExecutor` class that:
- Processes flow graphs
- Executes node logic sequentially
- Manages variables and state
- Handles conditional branching

## 📱 Usage Guide

### Creating a Flow

1. **Navigate to Flow Builder**
   - Click "Flow Builder" button in Dashboard
   - Or visit `/flow-builder` directly

2. **Add Nodes**
   - Drag node types from left sidebar
   - Position nodes on canvas
   - Double-click to configure content

3. **Connect Nodes**
   - Drag from output handles to input handles
   - Condition nodes have two outputs (True/False)
   - Create logical flow paths

4. **Save Flow**
   - Enter a flow name
   - Click "Save Flow" button
   - Flow is stored in database

### Testing Flows

1. **Save your flow first**
2. **Use the test endpoint**: `POST /api/flow/:id/test`
3. **Provide test input**: `{ "input": "your test message" }`
4. **Review execution results**

### Flow Examples

#### Simple Welcome Flow
```
Message Node: "Hello! How can I help you?"
    ↓
Condition Node: Check for "help" keyword
    ↓ (True)
Message Node: "Here's how I can help..."
    ↓ (False)
Message Node: "I didn't understand. Type 'help' for assistance."
```

#### Customer Support Flow
```
Message Node: "Welcome to support! What's your issue?"
    ↓
Condition Node: Check for "billing"
    ↓ (True)
Action Node: Add tag "billing_issue"
    ↓
Message Node: "I'll connect you to billing support..."
    ↓ (False)
Condition Node: Check for "technical"
    ↓ (True)
Action Node: Add tag "technical_issue"
    ↓
Message Node: "Let me help with your technical problem..."
```

## 🔌 API Endpoints

### Flow Management
- `POST /api/flow/save` - Save/update flow
- `GET /api/flow/get/:name` - Get flow by name
- `GET /api/flow/user` - Get user's flows
- `DELETE /api/flow/:id` - Delete flow
- `PATCH /api/flow/:id/toggle` - Toggle flow status
- `PATCH /api/flow/:id/metadata` - Update flow metadata

### Flow Testing
- `POST /api/flow/:id/test` - Test flow execution

## 🗄️ Database Schema

```javascript
{
  userId: String,           // User who owns the flow
  name: String,             // Unique flow name
  flowJson: Object,         // React Flow configuration
  description: String,      // Flow description
  isActive: Boolean,        // Flow status
  tags: [String],           // Categorization tags
  createdAt: Date,          // Creation timestamp
  updatedAt: Date           // Last update timestamp
}
```

## 🚧 Future Enhancements

### Phase 3.1: Advanced Nodes
- **Database Node**: Query/update database
- **Webhook Node**: Send HTTP requests
- **Email Node**: Send emails
- **SMS Node**: Send text messages

### Phase 3.2: Flow Templates
- Pre-built flow templates
- Community flow sharing
- Flow marketplace

### Phase 3.3: Advanced Logic
- Mathematical operations
- Date/time functions
- String manipulation
- Array operations

### Phase 3.4: Integration
- Instagram message processing
- Email automation
- CRM integration
- Analytics dashboard

## 🐛 Troubleshooting

### Common Issues

1. **Nodes not connecting**
   - Ensure handles are properly positioned
   - Check that source and target handles exist

2. **Flow not saving**
   - Verify flow name is provided
   - Check for duplicate flow names
   - Ensure backend is running

3. **Flow execution errors**
   - Verify flow has a start node (no incoming edges)
   - Check node configurations
   - Review execution logs

### Debug Tips

- Use browser console for frontend errors
- Check backend logs for API errors
- Test individual nodes before complex flows
- Start with simple flows and build complexity gradually

## 📚 Resources

- [React Flow Documentation](https://reactflow.dev/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)
- [MongoDB Schema Design](https://docs.mongodb.com/manual/data-modeling/)

## 🎉 Conclusion

The Bot Flow Builder provides a powerful foundation for creating automated conversation flows. With its visual interface and extensible architecture, users can build complex bot behaviors without writing code.

The system is designed to scale from simple welcome messages to sophisticated customer support workflows, making it suitable for both MVP testing and production use.
