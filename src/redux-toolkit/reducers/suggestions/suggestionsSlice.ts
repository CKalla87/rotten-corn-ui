import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getUserSuggestions } from '@redux/api/suggestion';
import type { UserProfile } from '../user/userSlice';

interface SuggestionsState {
  users: UserProfile[];
  isLoading: boolean;
}

interface AddToSuggestionsPayload {
  isLoading: boolean;
  users: UserProfile[];
}

const initialState: SuggestionsState = {
  users: [],
  isLoading: false
};

const suggestionsSlice = createSlice({
  name: 'suggestions',
  initialState,
  reducers: {
    addToSuggestions: (state, action: PayloadAction<AddToSuggestionsPayload>) => {
      const { isLoading, users } = action.payload;
      state.users = [...users];
      state.isLoading = isLoading;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(getUserSuggestions.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getUserSuggestions.fulfilled, (state, action) => {
      state.isLoading = false;
      const { users } = action.payload;
      state.users = [...users];
    });
    builder.addCase(getUserSuggestions.rejected, (state) => {
      state.isLoading = false;
    });
  }
});

export const { addToSuggestions } = suggestionsSlice.actions;
export default suggestionsSlice.reducer;

