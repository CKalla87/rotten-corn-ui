import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { orderBy } from 'lodash';
import { getConversationList } from '@redux/api/chat';
import { getUserSuggestions } from '@redux/api/suggestion';
import type { UserProfile } from '../user/userSlice';

interface ChatState {
  chatList: unknown[];
  selectedChatUser: UserProfile | null;
  isLoading: boolean;
}

interface AddToChatListPayload {
  isLoading: boolean;
  chatList: unknown[];
}

interface SetSelectedChatUserPayload {
  isLoading: boolean;
  user: UserProfile | null;
}

const initialState: ChatState = {
  chatList: [],
  selectedChatUser: null,
  isLoading: false
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addToChatList: (state, action: PayloadAction<AddToChatListPayload>) => {
      const { isLoading, chatList } = action.payload;
      state.chatList = [...chatList];
      state.isLoading = isLoading;
    },
    setSelectedChatUser: (state, action: PayloadAction<SetSelectedChatUserPayload>) => {
      const { isLoading, user } = action.payload;
      state.selectedChatUser = user;
      state.isLoading = isLoading;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(getConversationList.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getConversationList.fulfilled, (state, action) => {
      const { list } = action.payload;
      state.isLoading = false;
      const sortedList = orderBy(list, ['createdAt'], ['desc']);
      state.chatList = [...sortedList];
    });
    builder.addCase(getConversationList.rejected, (state) => {
      state.isLoading = false;
    });
    builder.addCase(getUserSuggestions.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getUserSuggestions.fulfilled, (state) => {
      state.isLoading = false;
    });
    builder.addCase(getUserSuggestions.rejected, (state) => {
      state.isLoading = false;
    });
  }
});

export const { addToChatList, setSelectedChatUser } = chatSlice.actions;
export default chatSlice.reducer;

