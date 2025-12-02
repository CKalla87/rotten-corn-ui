import { createAsyncThunk } from '@reduxjs/toolkit';
import { userService } from '@services/api/user/user.service';
import type { UserProfile } from '@redux/reducers/user/userSlice';

interface GetUserSuggestionsResponse {
  users: UserProfile[];
}

const getUserSuggestions = createAsyncThunk<GetUserSuggestionsResponse, void>(
  'user/getSuggestions',
  async () => {
    try {
      const response = await userService.getUserSuggestions();
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
);

export { getUserSuggestions };

