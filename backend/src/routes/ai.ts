import { Router } from 'express';
import { detectAiConflicts } from '../services/ai-conflicts.js';

export const aiRoutes = Router();

aiRoutes.post('/detect-conflicts', async (_req, res) => {
  try {
    const conflicts = await detectAiConflicts();
    res.json({ conflicts });
  } catch (error) {
    console.error('AI conflict detection failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to detect conflicts',
    });
  }
});
