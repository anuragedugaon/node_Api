const express = require('express');
const connectDatabase = require('./config/database');
const { APP_CONFIG } = require('./config/constants');
const postRoutes = require('./routes/post.routes');
const userRoutes = require('./routes/user.routes');
const commentRoutes = require('./routes/comment.routes');

const app = express();

// Initialize database connection
connectDatabase();

// Middleware
app.use(express.json());

// Routes
app.use('/posts', postRoutes);
app.use('/users', userRoutes);
app.use('/comments', commentRoutes);

// Start server
const port = APP_CONFIG.PORT;
app.listen(port, () => {  
  console.log(`Server is running on http://localhost:${port}`);
});