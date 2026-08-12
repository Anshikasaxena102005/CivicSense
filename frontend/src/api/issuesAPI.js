import API from './axios';

export const issuesAPI = {
  // Citizen
  create:   (formData) => API.post('/citizen/issues', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyIssues: (params) => API.get('/citizen/issues', { params }),
  getMyIssue:  (id)     => API.get(`/citizen/issues/${id}`),
  deleteMyIssue: (id)   => API.delete(`/citizen/issues/${id}`),
  reopenIssue: (id, data) => API.patch(`/citizen/issues/${id}/reopen`, data),
  getMyStats:  ()       => API.get('/citizen/stats'),

  // Officer
  getAssigned: (params) => API.get('/officer/issues', { params }),
  getAssignedIssue: (id) => API.get(`/officer/issues/${id}`),
  updateStatus: (id, data) => API.patch(`/officer/issues/${id}/status`, data),
  addResolution: (id, data) => API.patch(`/officer/issues/${id}/resolution`, data),
  uploadAfterImages: (id, formData) => API.post(`/officer/issues/${id}/after-images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getOfficerStats: () => API.get('/officer/stats'),

  // Admin
  getAll:    (params) => API.get('/admin/issues', { params }),
  getById:   (id)     => API.get(`/admin/issues/${id}`),
  assign:    (id, data) => API.patch(`/admin/issues/${id}/assign`, data),
  deleteIssue: (id)   => API.delete(`/admin/issues/${id}`),

  // Public lookups
  getCategories:  () => API.get('/admin/public/categories'),
  getDepartments: () => API.get('/admin/public/departments'),
};
