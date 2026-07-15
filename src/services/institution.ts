import api from './api';

export async function getAll() {
  return api.get('/api/institutions');
}

export async function getById(id: string) {
  return api.get(`/api/institutions/${id}`);
}

export async function create(data: any) {
  return api.post('/api/institutions', data);
}

export async function update(id: string, data: any) {
  return api.patch(`/api/institutions/${id}`, data);
}

export async function remove(id: string) {
  return api.delete(`/api/institutions/${id}`);
}
