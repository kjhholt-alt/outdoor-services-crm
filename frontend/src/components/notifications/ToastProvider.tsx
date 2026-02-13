import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        className: 'dark:bg-gray-800 dark:text-white dark:border-gray-700',
        duration: 4000,
      }}
      richColors
      closeButton
    />
  );
}
