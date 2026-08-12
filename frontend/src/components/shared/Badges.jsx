const STATUS_CONFIG = {
  pending:     { label: 'Pending',     cls: 'badge-pending' },
  assigned:    { label: 'Assigned',    cls: 'badge-assigned' },
  in_progress: { label: 'In Progress', cls: 'badge-in_progress' },
  resolved:    { label: 'Resolved',    cls: 'badge-resolved' },
  rejected:    { label: 'Rejected',    cls: 'badge-rejected' },
  reopened:    { label: 'Reopened',    cls: 'badge-reopened' },
};

const PRIORITY_CONFIG = {
  low:      { label: 'Low',      cls: 'priority-low' },
  medium:   { label: 'Medium',   cls: 'priority-medium' },
  high:     { label: 'High',     cls: 'priority-high' },
  critical: { label: 'Critical', cls: 'priority-critical' },
};

export const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: 'badge bg-gray-100 text-gray-600' };
  return <span className={cfg.cls}>{cfg.label}</span>;
};

export const PriorityBadge = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority] || { label: priority, cls: 'badge bg-gray-100 text-gray-600' };
  return <span className={cfg.cls}>{cfg.label}</span>;
};
