import { createSlice } from '@reduxjs/toolkit';

export interface UserProfile {
  _id?: string;
  username?: string;
  email?: string;
  avatarColor?: string;
  avatarImage?: string;
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
    },
    clearUser: (state) => {
      state.token = '';
      state.profile = null;
    },
    updateUserProfile: (state, action) => {
      state.profile = action.payload;
    }
  }
});

export const { addUser, clearUser, updateUserProfile } = userSlice.actions;
export default userSlice.reducer;

