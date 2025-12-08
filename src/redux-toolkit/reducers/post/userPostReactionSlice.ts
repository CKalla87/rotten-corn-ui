import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface Reaction {
  type?: string;
  senderName?: string;
  postId?: string;
  [key: string]: unknown;
}

interface UserPostReactionState {
  reactions: Reaction[];
}

const initialState: UserPostReactionState = {
  reactions: []
};

const userPostReactionSlice = createSlice({
  name: 'userPostReactions',
  initialState,
  reducers: {
    addReactions: (state, action: PayloadAction<Reaction[]>) => {
      state.reactions = action.payload;
    }
  }
});

export const { addReactions } = userPostReactionSlice.actions;
export default userPostReactionSlice.reducer;


