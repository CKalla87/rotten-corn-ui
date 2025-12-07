import { createAsyncThunk } from '@reduxjs/toolkit';
import { postService } from '@services/api/post/post.service';

export const getPosts = createAsyncThunk('post/getPosts', async (page: number, { dispatch }) => {
  try {
    const response = await postService.getAllPosts(page);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
});


