import api from './api';

export async function getAll() {
  return api.get('/api/users');
}

export async function getById(id: string) {
  return api.get(`/api/users/${id}`);
}

export async function create(data: any) {
  return api.post('/api/users', data);
}

export async function update(id: string, data: any) {
  return api.patch(`/api/users/${id}`, data);
}

export async function remove(id: string) {
  return api.delete(`/api/users/${id}`);
}
