import { createContext, useContext, useState, type ReactNode } from 'react';

type NotifyContextType = { notify: (message: string) => void };
const NotifyContext = createContext<NotifyContextType | null>(null);

export function useNotify() {
  const value = useContext(NotifyContext);
  if (!value) throw new Error('useNotify must be used within NotifyProvider');
  return value.notify;
}

export function NotifyProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');

  const notify = (msg: string) => {
    setMessage(msg);
    window.setTimeout(() => setMessage(''), 3200);
  };

  return (
    <NotifyContext.Provider value={{ notify }}>
      {children}
      {message && (
        <div className="toast" role="status" data-testid="status-toast">
          {message}
        </div>
      )}
    </NotifyContext.Provider>
  );
}
