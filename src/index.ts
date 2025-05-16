import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import matchRoutes from './routes/match.routes';
import chatRoutes from './routes/chat.routes';
import messageRoutes from './routes/message.routes';
import websocketRoutes from './routes/websocket.routes';

// Initialize Express app
const app = express();
const port = process.env.PORT || 7001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/matches', matchRoutes);
app.use('/chats', chatRoutes);
app.use('/messages', messageRoutes);
app.use('/realtime', websocketRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Bumble Clone API',
    version: '1.0.0'
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date(),
    message: 'Service is running correctly'
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;