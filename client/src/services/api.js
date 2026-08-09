import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

// Refresh-then-retry flow — avoids logging out on expired access tokens
let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(newToken) {
  refreshSubscribers.forEach(function (cb) { cb(newToken); });
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb);
}

function forceLogout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

api.interceptors.response.use(
  function (response) { return response; },
  async function (error) {
    var originalRequest = error.config;

    // If the refresh call itself fails with 401, log out
    if (originalRequest.url === '/auth/refresh') {
      if (error.response && error.response.status === 401) {
        forceLogout();
      }
      return Promise.reject(error);
    }

    // Only attempt refresh for 401s that haven't been retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Another 401 arrived while refresh is in progress — queue this request
        return new Promise(function (resolve) {
          addRefreshSubscriber(function (newToken) {
            originalRequest.headers.Authorization = 'Bearer ' + newToken;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;
      originalRequest._retry = true;

      try {
        var refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          forceLogout();
          return Promise.reject(error);
        }

        var refreshRes = await api.post('/auth/refresh', { refreshToken: refreshToken });
        var newAccessToken = refreshRes.data.accessToken;
        var newRefreshToken = refreshRes.data.refreshToken;

        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        onRefreshed(newAccessToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = 'Bearer ' + newAccessToken;
        return api(originalRequest);
      } catch (refreshErr) {
        isRefreshing = false;
        refreshSubscribers = [];
        forceLogout();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
