import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { emptyPostData, type EmptyPostData } from '@services/utils/static.data';

const initialState: EmptyPostData = emptyPostData;

const postSlice = createSlice({
  name: 'post',
  initialState,
  reducers: {
    updatePostItem: (_state, action: PayloadAction<Partial<EmptyPostData>>) => {
      // Replace the entire state with the new post data
      return { ...emptyPostData, ...action.payload };
    },
    clearPost: () => {
      return emptyPostData;
    }
  }
});

export const { updatePostItem, clearPost } = postSlice.actions;
export default postSlice.reducer;


