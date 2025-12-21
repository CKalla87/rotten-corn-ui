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
      state.posts = state.posts.filter((post: unknown) => {
        const postObj = post as { _id?: string };
        return postObj._id !== action.payload;
      });
      // Decrement total count if we actually removed a post
      if (state.posts.length < originalLength) {
        state.totalPostsCount = Math.max(0, state.totalPostsCount - 1);
      }
    },
    updatePostInList: (state, action) => {
      const payload = action.payload as { _id?: string };
      const index = state.posts.findIndex((post: unknown) => {
        const postObj = post as { _id?: string };
        return postObj._id === payload._id;
      });
      if (index > -1) {
        // Create a new array to ensure React re-renders
        const newPosts = [...state.posts];
        newPosts[index] = action.payload;
        state.posts = newPosts;
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
      // Always update posts, even if empty array (to ensure state is synced on refresh)
      state.posts = Array.isArray(posts) ? [...posts] : [];
      state.totalPostsCount = totalPosts || 0;
    });
    builder.addCase(getPosts.rejected, (state) => {
      state.isLoading = false;
      // Don't clear posts on error - keep existing posts if any
    });
  }
});

export const { addToPosts, removePost, updatePostInList } = postsSlice.actions;
export default postsSlice.reducer;

