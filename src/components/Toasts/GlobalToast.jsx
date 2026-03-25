import React from 'react';
import { toast } from 'sonner';

const GlobalToast = (ToastMessage, type) => {
  if (type === 'error') {
    return toast.error(ToastMessage);
  }
  if (type === 'info') {
    return toast.info(ToastMessage);
  }
  if (type === 'warning') {
    return toast.warning(ToastMessage);
  }
  return toast.success(ToastMessage);
};

export default GlobalToast;
