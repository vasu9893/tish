# 🤝 Contributing to InstantChat

**Thank you for your interest in contributing to InstantChat! This guide will help you get started.**

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Community](#community)

## 📜 Code of Conduct

### **Our Pledge**
We are committed to providing a welcoming and inspiring community for all. We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### **Our Standards**
Examples of behavior that contributes to creating a positive environment include:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior include:
- The use of sexualized language or imagery and unwelcome sexual attention or advances
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

## 🚀 Getting Started

### **Ways to Contribute**
- **Bug Reports**: Report bugs and issues
- **Feature Requests**: Suggest new features
- **Code Contributions**: Submit pull requests
- **Documentation**: Improve documentation
- **Testing**: Help with testing and quality assurance
- **Community**: Help other users and contributors

### **Before You Start**
1. **Check existing issues** to see if your idea is already being worked on
2. **Join our community** discussions to understand the project better
3. **Read the documentation** to understand the current architecture
4. **Set up your development environment** (see below)

## 🔧 Development Setup

### **Prerequisites**
- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **Git**: Version 2.20 or higher
- **MongoDB**: Local instance or MongoDB Atlas account
- **Code Editor**: VS Code (recommended) or your preferred editor

### **Fork and Clone**
```bash
# Fork the repository on GitHub
# Then clone your fork locally
git clone https://github.com/YOUR_USERNAME/instantchat.git
cd instantchat

# Add the original repository as upstream
git remote add upstream https://github.com/ORIGINAL_OWNER/instantchat.git
```

### **Install Dependencies**
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### **Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Configure your environment variables
MONGO_URI=mongodb://localhost:27017/instantchat
JWT_SECRET=your_development_secret_key
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_VERIFY_TOKEN=your_webhook_verify_token
CLIENT_URL=http://localhost:5173
```

### **Start Development Servers**
```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

## 📝 Contributing Guidelines

### **Issue Labels**
We use the following labels to categorize issues:
- **bug**: Something isn't working
- **enhancement**: New feature or request
- **documentation**: Improvements or additions to documentation
- **good first issue**: Good for newcomers
- **help wanted**: Extra attention is needed
- **priority: high**: High priority issue
- **priority: low**: Low priority issue

### **Branch Naming Convention**
```bash
# Feature branches
feature/feature-name
feature/user-authentication
feature/instagram-integration

# Bug fix branches
fix/bug-description
fix/login-validation-error
fix/flow-execution-issue

# Documentation branches
docs/documentation-update
docs/api-documentation
docs/user-guide
```

### **Commit Message Format**
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
# Format
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]

# Examples
feat(auth): add two-factor authentication support

fix(api): resolve Instagram webhook validation issue

docs(readme): update installation instructions

style(ui): improve button component styling

refactor(flow): optimize flow execution engine

test(auth): add unit tests for JWT validation
```

### **Commit Types**
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools

## 💻 Code Standards

### **JavaScript/React Standards**
- **ESLint**: Follow the project's ESLint configuration
- **Prettier**: Use Prettier for code formatting
- **React Hooks**: Use functional components with hooks
- **TypeScript**: Consider using TypeScript for new features

### **Code Style Guidelines**
```javascript
// ✅ Good: Clear variable names
const userProfile = await getUserProfile(userId)
const isAuthenticated = checkAuthStatus(token)

// ❌ Bad: Unclear variable names
const up = await getUP(uid)
const auth = checkAuth(t)

// ✅ Good: Descriptive function names
async function validateUserInput(input) {
  // validation logic
}

// ❌ Bad: Unclear function names
async function validate(input) {
  // validation logic
}

// ✅ Good: Proper error handling
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('Failed to complete operation')
}

// ❌ Bad: Poor error handling
const result = await riskyOperation()
return result
```

### **Component Structure**
```jsx
// ✅ Good: Organized component structure
import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { useAuth } from '../hooks/useAuth'
import { formatDate } from '../utils/helpers'

const UserProfile = ({ userId }) => {
  // State declarations
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Custom hooks
  const { user } = useAuth()
  
  // Effects
  useEffect(() => {
    loadProfile()
  }, [userId])
  
  // Event handlers
  const handleUpdate = async () => {
    // update logic
  }
  
  // Render methods
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div className="user-profile">
      {/* JSX content */}
    </div>
  )
}

export default UserProfile
```

### **API Design Standards**
```javascript
// ✅ Good: Consistent API response format
{
  success: true,
  data: {
    // response data
  },
  message: "Operation completed successfully"
}

// ✅ Good: Error response format
{
  success: false,
  error: "Validation failed",
  details: {
    field: "error message"
  }
}

// ✅ Good: Proper HTTP status codes
res.status(200).json({ success: true, data: result })
res.status(201).json({ success: true, data: createdItem })
res.status(400).json({ success: false, error: "Bad request" })
res.status(404).json({ success: false, error: "Not found" })
res.status(500).json({ success: false, error: "Internal server error" })
```

## 🧪 Testing

### **Testing Requirements**
- **Unit Tests**: Required for new features and bug fixes
- **Integration Tests**: Required for API endpoints
- **Test Coverage**: Aim for 80%+ coverage
- **Test Naming**: Use descriptive test names

### **Running Tests**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test files
npm test -- --testPathPattern=auth

# Run tests in specific directory
npm test -- --testPathPattern=server/routes
```

### **Writing Tests**
```javascript
// ✅ Good: Descriptive test names
describe('User Authentication', () => {
  it('should successfully login with valid credentials', async () => {
    // test implementation
  })
  
  it('should reject login with invalid password', async () => {
    // test implementation
  })
  
  it('should handle network errors gracefully', async () => {
    // test implementation
  })
})

// ✅ Good: Proper test structure
describe('Flow Engine', () => {
  let flowEngine
  let mockUser
  let mockFlow
  
  beforeEach(() => {
    flowEngine = new FlowEngine()
    mockUser = createMockUser()
    mockFlow = createMockFlow()
  })
  
  afterEach(() => {
    // cleanup
  })
  
  it('should execute message node correctly', async () => {
    // Arrange
    const messageNode = createMessageNode('Hello, world!')
    
    // Act
    const result = await flowEngine.executeNode(messageNode, mockUser)
    
    // Assert
    expect(result.success).toBe(true)
    expect(result.message).toBe('Hello, world!')
  })
})
```

## 🔄 Pull Request Process

### **Before Submitting a PR**
1. **Ensure tests pass** locally
2. **Update documentation** if needed
3. **Follow coding standards** and style guidelines
4. **Test your changes** thoroughly
5. **Update CHANGELOG.md** if applicable

### **PR Template**
```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Screenshots/videos attached (if UI changes)

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Additional Notes
Any additional information or context.
```

### **PR Review Process**
1. **Automated checks** must pass (tests, linting, build)
2. **Code review** by maintainers
3. **Address feedback** and make requested changes
4. **Maintainer approval** required for merge
5. **Squash and merge** when approved

## 🐛 Issue Reporting

### **Bug Report Template**
```markdown
## Bug Description
Clear and concise description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- OS: [e.g. Windows 10, macOS 11.0]
- Browser: [e.g. Chrome 90, Safari 14]
- Version: [e.g. 1.0.0]
- Node.js: [e.g. 18.0.0]

## Additional Context
Any other context about the problem.
```

### **Feature Request Template**
```markdown
## Feature Description
Clear and concise description of the feature.

## Problem Statement
A clear and concise description of what the problem is.

## Proposed Solution
A clear and concise description of what you want to happen.

## Alternative Solutions
A clear and concise description of any alternative solutions you've considered.

## Additional Context
Add any other context or screenshots about the feature request.
```

## 🌟 Community

### **Getting Help**
- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Discord**: For real-time chat and support
- **Email**: For private or sensitive matters

### **Contributor Recognition**
- **Contributors list** on GitHub
- **Special badges** for significant contributions
- **Mention in release notes** for major contributions
- **Invitation to maintainer team** for consistent contributors

### **Code of Conduct Enforcement**
- **Report violations** to maintainers
- **Fair and consistent** enforcement
- **Appeal process** for decisions
- **Community involvement** in policy decisions

## 📚 Additional Resources

### **Development Tools**
- **VS Code Extensions**: ESLint, Prettier, GitLens
- **Browser DevTools**: React DevTools, Redux DevTools
- **API Testing**: Postman, Insomnia
- **Database Tools**: MongoDB Compass, Studio 3T

### **Learning Resources**
- **React Documentation**: https://reactjs.org/docs
- **Node.js Documentation**: https://nodejs.org/docs
- **MongoDB Documentation**: https://docs.mongodb.com
- **Express.js Documentation**: https://expressjs.com

### **Project Documentation**
- **README.md**: Project overview and setup
- **API_DOCUMENTATION.md**: API reference
- **TECHNICAL_ARCHITECTURE.md**: System design
- **USER_GUIDE.md**: End-user documentation

## 🎯 Next Steps

1. **Set up your development environment**
2. **Find an issue** to work on
3. **Join our community** discussions
4. **Submit your first contribution**
5. **Become a regular contributor**

---

**Thank you for contributing to InstantChat! 🚀**

**Questions? Contact us at contributors@instantchat.com**
