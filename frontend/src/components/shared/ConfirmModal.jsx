import { FiAlertTriangle } from 'react-icons/fi';

export const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Delete', confirmClass = 'btn-danger', loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <FiAlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onCancel} className="btn-outline" disabled={loading}>Cancel</button>
          <button onClick={onConfirm} className={confirmClass} disabled={loading}>
            {loading ? 'Processing…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
