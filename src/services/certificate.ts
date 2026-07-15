import api from './api';

export async function getAll() {
  return api.get('/api/certificates');
}

export async function getById(id: string) {
  return api.get(`/api/certificates/${id}`);
}

export async function publicLookup(id: string) {
  return api.get(`/api/certificates/public/${id}`);
}

export async function issue(data: any) {
  return api.post('/api/certificates', data);
}

export async function updateStatus(id: string, status: 'active' | 'suspended' | 'revoked', reason: string) {
  return api.patch(`/api/certificates/${id}/status`, { status, reason });
}
