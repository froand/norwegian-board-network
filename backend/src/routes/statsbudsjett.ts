import { Router } from 'express';
import { getBudgetMatchesForPerson } from '../services/statsbudsjett.js';

export const statsbudsjettRoutes = Router();

statsbudsjettRoutes.get('/person/:personId', async (req, res) => {
  const { personId } = req.params;

  try {
    const result = await getBudgetMatchesForPerson(personId);
    if (!result) {
      res.status(404).json({ error: 'Person not found' });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Statsbudsjett person endpoint failed:', error);
    res.status(500).json({ error: 'Failed to load Statsbudsjett matches' });
  }
});
