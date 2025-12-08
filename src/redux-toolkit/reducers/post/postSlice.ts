import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { emptyPostData, type EmptyPostData } from '@services/utils/static.data';

const initialState: EmptyPostData = emptyPostData;

const postSlice = createSlice({
  name: 'post',
  initialState,
  reducers: {
    updatePostItem: (state, action: PayloadAction<Partial<EmptyPostData>>) => {
      for (const [key, value] of Object.entries(action.payload)) {
        (state as Record<string, unknown>)[key] = value;
      }
    },
    clearPost: () => {
      return emptyPostData;
    }
  }
});

export const { updatePostItem, clearPost } = postSlice.actions;
export default postSlice.reducer;


