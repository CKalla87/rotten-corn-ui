import { configureStore } from '@reduxjs/toolkit';
import userReducer from './reducers/user/userSlice';
import suggestionsReducer from './reducers/suggestions/suggestionsSlice';
import notificationsReducer from './reducers/notifications/notificationSlice';
import modalReducer from './reducers/modal/modalSlice';
import postReducer from './reducers/post/postSlice';
import postsReducer from './reducers/posts/postsSlice';
import userPostReactionReducer from './reducers/post/userPostReactionSlice';
import chatReducer from './reducers/chat/chatSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    suggestions: suggestionsReducer,
    notifications: notificationsReducer,
    modal: modalReducer,
    post: postReducer,
    allPosts: postsReducer,
    userPostReactions: userPostReactionReducer,
    chat: chatReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

