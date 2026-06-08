import { Router } from 'express';
import { getPersonSummary } from '../services/ai-summary.js';

export const aiRoutes = Router();

aiRoutes.get('/person-summary/:personId', async (req, res) => {
  const { personId } = req.params;

  try {
    const summary = await getPersonSummary(personId);
    if (!summary) {
      res.status(404).json({ error: 'Person data not found' });
      return;
    }
    res.json(summary);
  } catch (error) {
    console.error('AI person summary error:', error);
    const message = error instanceof Error ? error.message : '';
    if (message.includes('not configured')) {
      res.status(503).json({ error: 'AI summary is not configured' });
      return;
    }
    res.status(500).json({ error: 'Failed to generate AI person summary' });
  }
});
