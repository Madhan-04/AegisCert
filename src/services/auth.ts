import api from './api';

export async function login(username: string, password: string, role: string) {
  const result = (await api.post('/api/auth/login', { username, password, role })) as any;
  if (result && result.accessToken) {
    sessionStorage.setItem('csv_jwt_token', result.accessToken);
    localStorage.setItem('csv_refresh_token', result.refreshToken);
    sessionStorage.setItem('csv_user_session', JSON.stringify(result.user));
  }
  return result;
}

export async function logout() {
  const refreshToken = localStorage.getItem('csv_refresh_token');
  try {
    await api.post('/api/auth/logout', { refreshToken });
  } catch (e) {}
  sessionStorage.clear();
  localStorage.removeItem('csv_refresh_token');
  window.location.hash = '#/login';
}

export async function setupMpin(mpin: string) {
  return api.post('/api/auth/setup-mpin', { mpin });
}

export async function verifyMpin(mpin: string) {
  return api.post('/api/auth/verify-mpin', { mpin });
}
