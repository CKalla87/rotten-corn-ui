import { createAsyncThunk } from '@reduxjs/toolkit';
import { chatService } from '@services/api/chat/chat.service';
import { Utils } from '@services/utils/utils.service';
import type { AppDispatch } from '../store';

export const getConversationList = createAsyncThunk(
  'chat/getUserChatList',
  async (_name: string | undefined, thunkAPI) => {
    try {
      const response = await chatService.getConversationList();
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', thunkAPI.dispatch as AppDispatch);
      throw error;
    }
  }
);

