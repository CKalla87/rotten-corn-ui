import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from '@root/routes';
import { socketService } from '@services/socket/socket.service';
import Toast from '@components/toast/Toast';
import type { RootState } from '@redux/store';
import type { NotificationItem } from '@redux/reducers/notifications/notificationSlice';
import '@root/App.sass';

export const APP_ENVIRONMENT = import.meta.env.VITE_APP_ENVIRONMENT || import.meta.env.MODE || 'local';

interface ToastItem {
  id?: string;
  description: string;
  backgroundColor?: string;
  icon?: string;
  [key: string]: unknown;
}

const App = () => {
  const notifications = useSelector((state: RootState) => state.notifications);

  const toastList = useMemo<ToastItem[]>(() => {
    return notifications.map((notification: NotificationItem) => ({
      id: typeof notification.id === 'string' ? notification.id : notification.id?.toString(),
      description: notification.description,
      backgroundColor: notification.backgroundColor,
      icon: notification.icon
    }));
  }, [notifications]);

  useEffect(() => {
    socketService.setupSocketConnection();
  }, []);

  return (
    <>
      {toastList && toastList.length > 0 && (
        <Toast position="top-right" toastList={toastList} autoDelete={true} />
      )}
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </>
  );
};

export default App;
