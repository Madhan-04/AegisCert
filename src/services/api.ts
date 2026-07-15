import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach Bearer token dynamically
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('csv_jwt_token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Catch 401s and attempt session refresh
api.interceptors.response.use(
  (response) => {
    // Standard response shape unwrapper
    if (response.data && response.data.success) {
      return response.data.data !== undefined ? response.data.data : response.data;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('csv_refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        // Redirect to login if no refresh token
        sessionStorage.clear();
        window.location.hash = '#/login';
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/refresh`,
          { refreshToken }
        );

        if (res.data && res.data.success) {
          const newAccessToken = res.data.data.accessToken;
          sessionStorage.setItem('csv_jwt_token', newAccessToken);
          
          isRefreshing = false;
          processQueue(null, newAccessToken);

          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        isRefreshing = false;
        processQueue(refreshErr, null);
        
        // Clear session and redirect on verification failure
        sessionStorage.clear();
        localStorage.removeItem('csv_refresh_token');
        window.location.hash = '#/login';
        
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default api;
export { api };
