import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Bindings, Variables } from './types';

// Import routes
import auth from './routes/auth';
import clients from './routes/clients';
import templates from './routes/templates';
import projects from './routes/projects';
import tasks from './routes/tasks';
import dashboard from './routes/dashboard';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware globali
app.use('*', logger());
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// API Routes
app.route('/api/auth', auth);
app.route('/api/clients', clients);
app.route('/api/templates', templates);
app.route('/api/projects', projects);
app.route('/api/tasks', tasks);
app.route('/api/dashboard', dashboard);

// Health check
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root route - Serve frontend
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestionale Agenzia</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .area-badge-copywriting { @apply bg-blue-100 text-blue-800; }
        .area-badge-video { @apply bg-purple-100 text-purple-800; }
        .area-badge-adv { @apply bg-green-100 text-green-800; }
        .area-badge-grafica { @apply bg-pink-100 text-pink-800; }
    </style>
</head>
<body class="bg-gray-50">
    <div id="app"></div>
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/app.js"></script>
</body>
</html>
  `);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ 
    error: 'Internal server error',
    message: err.message 
  }, 500);
});

export default app;
