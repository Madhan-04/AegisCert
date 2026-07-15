import api from './api';

export async function getAll() {
  return api.get('/api/audit');
}

export async function write(action: string, details: string, riskScore: number = 0) {
  return api.post('/api/audit', { action, details, riskScore });
}
