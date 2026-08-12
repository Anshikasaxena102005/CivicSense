import API from './axios';

export const notificationsAPI = {
  getAll:       (params) => API.get('/notifications', { params }),
  getUnreadCount: ()     => API.get('/notifications/unread-count'),
  markRead:     (id)     => API.patch(`/notifications/${id}/read`),
  markAllRead:  ()       => API.patch('/notifications/read-all'),
  delete:       (id)     => API.delete(`/notifications/${id}`),
};
