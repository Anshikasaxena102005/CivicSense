import API from './axios';

export const adminAPI = {
  getStats:       ()        => API.get('/admin/stats'),
  getUsers:       (params)  => API.get('/admin/users', { params }),
  getOfficers:    (params)  => API.get('/admin/officers', { params }),
  createOfficer:  (data)    => API.post('/admin/users/officer', data),
  toggleUser:     (id)      => API.patch(`/admin/users/${id}/toggle`),

  getCategories:    ()      => API.get('/admin/categories'),
  createCategory:   (data)  => API.post('/admin/categories', data),
  updateCategory:   (id, data) => API.put(`/admin/categories/${id}`, data),
  deleteCategory:   (id)    => API.delete(`/admin/categories/${id}`),

  getDepartments:   ()      => API.get('/admin/departments'),
  createDepartment: (data)  => API.post('/admin/departments', data),
  updateDepartment: (id, data) => API.put(`/admin/departments/${id}`, data),
  deleteDepartment: (id)    => API.delete(`/admin/departments/${id}`),
};
