import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const routeService = {
  planRoute: async (payload) => {
    const res = await api.post('/routes/plan', payload);
    return res.data;
  },
  compareRoutes: async (payload) => {
    const res = await api.post('/routes/compare', payload);
    return res.data;
  },
  getNodes: async () => {
    const res = await api.get('/routes/nodes');
    return res.data;
  },
  getHistory: async (limit = 25) => {
    const res = await api.get(`/routes/history?limit=${limit}`);
    return res.data;
  }
};

export const riskService = {
  getSegments: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/risk/segments${query ? `?${query}` : ''}`);
    return res.data;
  },
  predictRisk: async (payload) => {
    const res = await api.post('/risk/predict', payload);
    return res.data;
  },
  toggleBlock: async (segmentId, isBlocked) => {
    const res = await api.post('/risk/toggle-block', {
      segment_id: segmentId,
      is_blocked: isBlocked
    });
    return res.data;
  },
  clearBlocks: async () => {
    const res = await api.post('/risk/clear-blocks');
    return res.data;
  },
  getBlockedSegments: async () => {
    const res = await api.get('/risk/blocked');
    return res.data;
  }
};

export const modelService = {
  getMetrics: async () => {
    const res = await api.get('/model/metrics');
    return res.data;
  },
  getFeatureImportance: async () => {
    const res = await api.get('/model/feature-importance');
    return res.data;
  }
};

export const dashboardService = {
  getStats: async () => {
    const res = await api.get('/dashboard/stats');
    return res.data;
  },
  getDataStatus: async () => {
    const res = await api.get('/data/status');
    return res.data;
  }
};

export default api;
