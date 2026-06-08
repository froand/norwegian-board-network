import express from 'express';
import cors from 'cors';
import { searchRoutes } from './routes/search.js';
import { graphRoutes } from './routes/graph.js';
import { companyRoutes } from './routes/company.js';
import { sourcesRoutes } from './routes/sources.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/search', searchRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/sources', sourcesRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
