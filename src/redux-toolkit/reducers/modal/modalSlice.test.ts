import modalReducer, { toggleImageModal, toggleFeelingModal } from './modalSlice';

describe('modal reducer', () => {
  const initialState = {
    type: '',
    isOpen: false,
    feeling: '',
    image: '',
    data: null,
    feelingsIsOpen: false,
    openFileDialog: false,
    gifModalIsOpen: false,
    reactionModalIsOpen: false,
    commentsModalIsOpen: false,
    deleteDialogIsOpen: false
  };

  it('should return the initial state', () => {
    expect(modalReducer(undefined, { type: '' })).toEqual(initialState);
  });

  it('should toggleImageModal()', () => {
    expect(modalReducer(initialState, toggleImageModal(true))).toEqual({
      type: '',
      isOpen: false,
      feeling: '',
      image: '',
      data: null,
      feelingsIsOpen: false,
      openFileDialog: true,
      gifModalIsOpen: false,
      reactionModalIsOpen: false,
      commentsModalIsOpen: false,
      deleteDialogIsOpen: false
    });
  });

  it('should toggleFeelingModal', () => {
    expect(modalReducer(initialState, toggleFeelingModal(true))).toEqual({
      type: '',
      isOpen: false,
      feeling: '',
      image: '',
      data: null,
      feelingsIsOpen: true,
      openFileDialog: false,
      gifModalIsOpen: false,
      reactionModalIsOpen: false,
      commentsModalIsOpen: false,
      deleteDialogIsOpen: false
    });
  });
});


