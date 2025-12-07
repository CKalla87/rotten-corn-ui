import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { cloneDeep } from 'lodash';
import { Utils } from '@services/utils/utils.service';
import './Toast.scss';

interface ToastItem {
  id?: string;
  description: string;
  backgroundColor?: string;
  icon?: string;
  [key: string]: unknown;
}

interface ToastProps {
  toastList: ToastItem[];
  position?: string;
  autoDelete?: boolean;
  autoDeleteTime?: number;
}

const Toast = ({ toastList, position = 'top-right', autoDelete = true, autoDeleteTime = 2000 }: ToastProps) => {
  const [list, setList] = useState<ToastItem[]>(toastList);
  const listData = useRef<ToastItem[]>([]);
  const dispatch = useDispatch();
  const prevToastListRef = useRef<ToastItem[]>([]);

  const syncedList = useMemo(() => {
    if (JSON.stringify(prevToastListRef.current) !== JSON.stringify(toastList)) {
      prevToastListRef.current = toastList;
      return toastList;
    }
    return list;
  }, [toastList, list]);

  useEffect(() => {
    if (JSON.stringify(list) !== JSON.stringify(syncedList)) {
      setList(syncedList);
    }
  }, [syncedList]);

  const deleteToast = useCallback(() => {
    listData.current = cloneDeep(list);
    listData.current.splice(0, 1);
    setList([...listData.current]);
    if (!listData.current.length) {
      setList([]);
      Utils.dispatchClearNotification(dispatch);
    }
  }, [list, dispatch]);

  useEffect(() => {
    const tick = () => {
      deleteToast();
    };

    if (autoDelete && toastList.length && list.length) {
      const interval = setInterval(tick, autoDeleteTime);
      return () => {
        clearInterval(interval);
      };
    }
  }, [toastList, autoDelete, autoDeleteTime, list, deleteToast]);

  return (
    <div className={`toast-notification-container ${position}`}>
      {list.map((toast, index) => (
        <div
          key={index}
          data-testid="toast-notification"
          className={`toast-notification toast ${position}`}
          style={{ backgroundColor: toast.backgroundColor }}
        >
          <button className="cancel-button" onClick={() => deleteToast()}>
            X
          </button>
          <div className={`toast-notification-image ${toast.description.length <= 73 ? 'toast-icon' : ''}`}>
            <img src={toast.icon} alt="" />
          </div>
          <div className={`toast-notification-message ${toast.description.length <= 73 ? 'toast-message' : ''}`}>
            {toast.description}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Toast;

