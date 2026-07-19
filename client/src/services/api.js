const getApiBase = () => {
  const url = import.meta.env.VITE_API_URL || '/api';
  if (url.startsWith('http') && !url.endsWith('/api') && !url.endsWith('/api/')) {
    return url.endsWith('/') ? `${url}api` : `${url}/api`;
  }
  return url;
};
const API_BASE = getApiBase();

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

const request = {
  get: async (url) => {
    const res = await fetch(`${API_BASE}${url}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  post: async (url, body) => {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    return handleResponse(res);
  },
  put: async (url, body) => {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    return handleResponse(res);
  },
  delete: async (url) => {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  }
};

export const api = {
  auth: {
    login: (username, password) => request.post('/auth/login', { username, password }),
    customerLogin: (username, password) => request.post('/auth/customer/login', { username, password }),
    getProfile: () => request.get('/auth/profile')
  },
  shops: {
    getAll: (search = '', hasDue = false, sortBy = '') => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (hasDue) params.append('hasDue', 'true');
      if (sortBy) params.append('sortBy', sortBy);
      return request.get(`/shops?${params.toString()}`);
    },
    getById: (id) => request.get(`/shops/${id}`),
    create: (data) => request.post('/shops', data),
    update: (id, data) => request.put(`/shops/${id}`, data),
    delete: (id) => request.delete(`/shops/${id}`),
    getHistory: (id) => request.get(`/shops/${id}/history`)
  },
  products: {
    getAll: (search = '', categoryId = '', lowStock = false) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryId) params.append('categoryId', categoryId);
      if (lowStock) params.append('lowStock', 'true');
      return request.get(`/products?${params.toString()}`);
    },
    getById: (id) => request.get(`/products/${id}`),
    create: (data) => request.post('/products', data),
    update: (id, data) => request.put(`/products/${id}`, data),
    delete: (id) => request.delete(`/products/${id}`),
    getCategories: () => request.get('/products/categories'),
    createCategory: (name) => request.post('/products/categories', { name })
  },
  suppliers: {
    getAll: (search = '') => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      return request.get(`/suppliers?${params.toString()}`);
    },
    getById: (id) => request.get(`/suppliers/${id}`),
    create: (data) => request.post('/suppliers', data),
    update: (id, data) => request.put(`/suppliers/${id}`, data),
    delete: (id) => request.delete(`/suppliers/${id}`)
  },
  stock: {
    getAll: () => request.get('/stock'),
    create: (data) => request.post('/stock', data),
    delete: (id) => request.delete(`/stock/${id}`)
  },
  deliveries: {
    getAll: (shopId = '', paymentStatus = '', status = '', date = '') => {
      const params = new URLSearchParams();
      if (shopId) params.append('shopId', shopId);
      if (paymentStatus) params.append('paymentStatus', paymentStatus);
      if (status) params.append('status', status);
      if (date) params.append('date', date);
      return request.get(`/deliveries?${params.toString()}`);
    },
    getById: (id) => request.get(`/deliveries/${id}`),
    create: (data) => request.post('/deliveries', data),
    dispatch: (id, body = {}) => request.put(`/deliveries/${id}/dispatch`, body),
    delete: (id) => request.delete(`/deliveries/${id}`)
  },
  areas: {
    getAll: () => request.get('/areas'),
    create: (data) => request.post('/areas', data),
    update: (id, data) => request.put(`/areas/${id}`, data),
    delete: (id) => request.delete(`/areas/${id}`)
  },
  payments: {
    getAll: (shopId = '') => request.get(`/payments${shopId ? `?shopId=${shopId}` : ''}`),
    create: (data) => request.post('/payments', data),
    delete: (id) => request.delete(`/payments/${id}`)
  },
  reports: {
    getDashboardStats: () => request.get('/reports/dashboard-stats'),
    getReport: (type, startDate = '', endDate = '', shopId = '') => {
      const params = new URLSearchParams({ type });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (shopId) params.append('shopId', shopId);
      return request.get(`/reports?${params.toString()}`);
    }
  }
};
