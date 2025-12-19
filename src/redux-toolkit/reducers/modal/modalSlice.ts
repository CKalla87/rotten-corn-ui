import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ModalState {
  type: string;
  isOpen: boolean;
  feeling: string;
  image: string;
  data: unknown | null;
  feelingsIsOpen: boolean;
  openFileDialog: boolean;
  openVideoDialog: boolean;
  gifModalIsOpen: boolean;
  reactionModalIsOpen: boolean;
  commentsModalIsOpen: boolean;
  deleteDialogIsOpen: boolean;
}

interface OpenModalPayload {
  type: string;
  data?: unknown;
}

const initialState: ModalState = {
  type: '',
  isOpen: false,
  feeling: '',
  image: '',
  data: null,
  feelingsIsOpen: false,
  openFileDialog: false,
  openVideoDialog: false,
  gifModalIsOpen: false,
  reactionModalIsOpen: false,
  commentsModalIsOpen: false,
  deleteDialogIsOpen: false
};

const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    openModal: (state, action: PayloadAction<OpenModalPayload>) => {
      const { type, data } = action.payload;
      state.isOpen = true;
      state.type = type;
      state.data = data || null;
    },
    closeModal: (state) => {
      state.isOpen = false;
      state.type = '';
      state.feeling = '';
      state.image = '';
      state.data = null;
      state.feelingsIsOpen = false;
      state.gifModalIsOpen = false;
      state.reactionModalIsOpen = false;
      state.commentsModalIsOpen = false;
      state.openFileDialog = false;
      state.openVideoDialog = false;
      state.deleteDialogIsOpen = false;
    },
    addPostFeeling: (state, action: PayloadAction<{ feeling: string }>) => {
      const { feeling } = action.payload;
      state.feeling = feeling;
    },
    toggleImageModal: (state, action: PayloadAction<boolean>) => {
      state.openFileDialog = action.payload;
    },
    toggleFeelingModal: (state, action: PayloadAction<boolean>) => {
      state.feelingsIsOpen = action.payload;
    },
    toggleGifModal: (state, action: PayloadAction<boolean>) => {
      state.gifModalIsOpen = action.payload;
    },
    toggleVideoModal: (state, action: PayloadAction<boolean>) => {
      state.openVideoDialog = action.payload;
    },
    toggleReactionsModal: (state, action: PayloadAction<boolean>) => {
      state.reactionModalIsOpen = action.payload;
    },
    toggleCommentsModal: (state, action: PayloadAction<boolean | { isOpen: boolean; postId?: string; post?: unknown }>) => {
      if (typeof action.payload === 'boolean') {
      state.commentsModalIsOpen = action.payload;
      } else {
        state.commentsModalIsOpen = action.payload.isOpen;
        if (action.payload.postId || action.payload.post) {
          state.data = { 
            postId: action.payload.postId,
            post: action.payload.post
          };
        }
      }
    },
    toggleDeleteDialog: (state, action: PayloadAction<{ data: unknown; toggle: boolean }>) => {
      const { data, toggle } = action.payload;
      state.deleteDialogIsOpen = toggle;
      state.data = data;
    }
  }
});

export const {
  openModal,
  closeModal,
  addPostFeeling,
  toggleImageModal,
  toggleFeelingModal,
  toggleGifModal,
  toggleVideoModal,
  toggleReactionsModal,
  toggleCommentsModal,
  toggleDeleteDialog
} = modalSlice.actions;
export default modalSlice.reducer;

