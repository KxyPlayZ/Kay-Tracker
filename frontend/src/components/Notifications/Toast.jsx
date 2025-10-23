// frontend/src/components/Notifications/Toast.jsx
import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X, XCircle } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'error':
        return <XCircle size={20} className="text-red-500" />;
      case 'warning':
        return <AlertCircle size={20} className="text-yellow-500" />;
      default:
        return <Info size={20} className="text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/90 border-green-200 dark:border-green-700';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/90 border-red-200 dark:border-red-700';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/90 border-yellow-200 dark:border-yellow-700';
      default:
        return 'bg-blue-50 dark:bg-blue-900/90 border-blue-200 dark:border-blue-700';
    }
  };

  return (
    <div className={`${getBgColor()} border rounded-lg shadow-lg p-4 flex items-start gap-3 min-w-[300px] max-w-md animate-slideIn`}>
      {getIcon()}
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-pre-line">
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default Toast;