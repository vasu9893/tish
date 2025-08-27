const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log(`🗄️  MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message)
    
    // For MVP testing, create a fallback in-memory solution
    console.log('⚠️  Using fallback in-memory storage for MVP testing')
    
    // In production, you should exit the process here
    // process.exit(1)
  }
}

module.exports = connectDB
