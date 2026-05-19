import express, { type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import errorHandler from './middleware/errorHandler';

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Health check for Docker / load balancer
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api', routes);

// 404 handler for unmatched routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);

export default app;
