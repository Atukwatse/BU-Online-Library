import { useEffect } from 'react';

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 bg-primary text-white px-5 py-3 rounded shadow-lg z-50 animate-fade-in">
      {message}
    </div>
  );
};

export default Toast;
