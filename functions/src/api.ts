import express from 'express';
import cors from 'cors';
import * as admin from 'firebase-admin';
import { authenticateApiKey } from './middleware/auth';
import { rateLimitMiddleware, logApiRequest } from './middleware/rateLimit';
import apiKeysRouter from './routes/apiKeys';
import submissionsRouter from './routes/submissions';
import boardsRouter from './routes/boards';
import statsRouter from './routes/stats';
import swaggerUi from 'swagger-ui-express';
// @ts-ignore
import openapi from './openapi.json';

admin.initializeApp();

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://feedsolve.com',
      'https://*.feedsolve.com',
    ],
    credentials: true,
  })
);

// Health check
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API documentation
app.use('/api/docs', swaggerUi.serve);
app.get('/api/docs', swaggerUi.setup(openapi as any));

// OpenAPI spec
app.get('/api/openapi.json', (req: express.Request, res: express.Response) => {
  res.json(openapi);
});

// API authentication and rate limiting
app.use('/api/', authenticateApiKey);
app.use('/api/', rateLimitMiddleware);
app.use('/api/', logApiRequest);

// Error handling for invalid API keys on protected routes
app.use('/api/', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && err.status === 401) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }
  next(err);
});

// Routes
app.use('/', apiKeysRouter);
app.use('/', submissionsRouter);
app.use('/', boardsRouter);
app.use('/', statsRouter);

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

export default app;
