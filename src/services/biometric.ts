import api from './api';

export async function enroll(userId: string, data: any) {
  return api.post('/api/biometrics/enroll', { userId, data });
}

export async function verify(userId: string, templateHash: string) {
  return api.post('/api/biometrics/verify', { userId, templateHash });
}
