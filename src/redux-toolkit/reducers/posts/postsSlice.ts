import { createSlice } from '@reduxjs/toolkit';
import { getPosts } from '../../api/posts';

interface PostsState {
  posts: unknown[];
  totalPostsCount: number;
  isLoading: boolean;
}

const initialState: PostsState = {
  posts: [],
  totalPostsCount: 0,
  isLoading: false
};

const postsSlice = createSlice({
  name: 'allPosts',
  initialState,
  reducers: {
    addToPosts: (state, action) => {
      state.posts = [...action.payload];
    },
    removePost: (state, action) => {
      const originalLength = state.posts.length;
      state.posts = state.posts.filter((post: any) => post._id !== action.payload);
      // Decrement total count if we actually removed a post
      if (state.posts.length < originalLength) {
        state.totalPostsCount = Math.max(0, state.totalPostsCount - 1);
      }
    },
    updatePostInList: (state, action) => {
      const index = state.posts.findIndex((post: any) => post._id === action.payload._id);
      if (index > -1) {
        state.posts[index] = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder.addCase(getPosts.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getPosts.fulfilled, (state, action) => {
      const { posts, totalPosts } = action.payload;
      state.isLoading = false;
      state.posts = [...posts];
      state.totalPostsCount = totalPosts;
    });
    builder.addCase(getPosts.rejected, (state) => {
      state.isLoading = false;
    });
  }
});

export const { addToPosts, removePost, updatePostInList } = postsSlice.actions;
export default postsSlice.reducer;

