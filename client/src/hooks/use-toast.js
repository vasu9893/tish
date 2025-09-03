import { toast } from 'sonner';

export const useToast = () => {
  return {
    toast: (message, options = {}) => {
      if (options.variant === 'destructive') {
        toast.error(message, options);
      } else if (options.variant === 'success') {
        toast.success(message, options);
      } else if (options.variant === 'warning') {
        toast.warning(message, options);
      } else {
        toast(message, options);
      }
    },
    dismiss: toast.dismiss,
    error: toast.error,
    success: toast.success,
    warning: toast.warning,
    info: toast.info,
  };
};
