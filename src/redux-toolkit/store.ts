import { configureStore } from '@reduxjs/toolkit';
import userReducer from './reducers/user/userSlice';
import suggestionsReducer from './reducers/suggestions/suggestionsSlice';
import notificationsReducer from './reducers/notifications/notificationSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    suggestions: suggestionsReducer,
    notifications: notificationsReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

