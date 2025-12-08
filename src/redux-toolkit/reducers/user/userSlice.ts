import { createSlice } from '@reduxjs/toolkit';

export interface UserProfile {
  _id?: string;
  username?: string;
  email?: string;
  avatarColor?: string;
  avatarImage?: string;
  profilePicture?: string;
  [key: string]: unknown;
}

interface UserState {
  token: string;
  profile: UserProfile | null;
}

const initialState: UserState = {
  token: '',
  profile: null
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    addUser: (state, action) => {
      const { token, profile } = action.payload;
      state.token = token;
      state.profile = profile;
      // Store token in localStorage for axios interceptor
      if (token) {
        try {
          localStorage.setItem('authToken', token);
        } catch (error) {
          console.error('Failed to store token in localStorage:', error);
        }
      }
    },
    clearUser: (state) => {
      state.token = '';
      state.profile = null;
      // Remove token from localStorage
      try {
        localStorage.removeItem('authToken');
      } catch (error) {
        console.error('Failed to remove token from localStorage:', error);
      }
    },
    updateUserProfile: (state, action) => {
      state.profile = action.payload;
    }
  }
});

export const { addUser, clearUser, updateUserProfile } = userSlice.actions;
export default userSlice.reducer;

