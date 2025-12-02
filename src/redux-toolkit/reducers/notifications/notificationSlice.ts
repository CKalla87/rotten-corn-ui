import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { cloneDeep, uniqBy } from 'lodash';
import checkIcon from '@assets/images/check.svg';
import errorIcon from '@assets/images/error.svg';
import infoIcon from '@assets/images/info.svg';
import warningIcon from '@assets/images/warning.svg';

export interface ToastIcon {
  success?: string;
  error?: string;
  info?: string;
  warning?: string;
  color?: string;
}

export interface NotificationItem {
  id?: string | number;
  _id?: string;
  description: string;
  type?: string;
  icon?: string;
  backgroundColor?: string;
  read?: boolean;
  [key: string]: unknown;
}

const initialState: NotificationItem[] = [];

const toastIcons: Array<Record<string, string>> = [
  { success: checkIcon, color: '#5cb85c' },
  { error: errorIcon, color: '#d9534f' },
  { info: infoIcon, color: '#5bc0de' },
  { warning: warningIcon, color: '#f0ad4e' }
];

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<{ message: string; type: string }>) => {
      const { message, type } = action.payload;
      const toast = toastIcons.find((toast) => toast[type]);
      const toastItem: NotificationItem = {
        id: state.length,
        description: message,
        type,
        icon: toast?.[type],
        backgroundColor: toast?.color
      };
      let list = cloneDeep(state);
      list.unshift(toastItem);
      list = [...uniqBy(list, 'description')];
      return list;
    },
    clearNotification: () => {
      return [];
    }
  }
});

export const { addNotification, clearNotification } = notificationSlice.actions;
export default notificationSlice.reducer;

