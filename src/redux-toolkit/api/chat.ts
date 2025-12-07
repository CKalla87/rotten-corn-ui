import { createAsyncThunk } from '@reduxjs/toolkit';
import { chatService } from '@services/api/chat/chat.service';
import { Utils } from '@services/utils/utils.service';
import type { AppDispatch } from '../store';

export const getConversationList = createAsyncThunk(
  'chat/getUserChatList',
  async (name: string = '', { dispatch }: { dispatch: AppDispatch }) => {
    try {
      const response = await chatService.getConversationList();
      return response.data;
    } catch (error: any) {
      Utils.dispatchNotification(error?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  }
);

