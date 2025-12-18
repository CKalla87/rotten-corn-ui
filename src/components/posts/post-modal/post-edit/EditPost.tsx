import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { find } from 'lodash';
import { FaTimes, FaArrowLeft } from 'react-icons/fa';
import PostWrapper from '@components/posts/modal-wrappers/post-wrapper/PostWrapper';
import ModalBoxContent from '@components/posts/post-modal/modal-box-content/ModalBoxContent';
import ModalBoxSelection from '@components/posts/post-modal/modal-box-content/ModalBoxSelection';
import Giphy from '@components/giphy/Giphy';
import Button from '@components/button/Button';
import Spinner from '@components/spinner/Spinner';
import { bgColors, feelingsList } from '@services/utils/static.data';
import { PostUtils } from '@services/utils/post-utils.service';
import { ImageUtils } from '@services/utils/image-utils.service';
import { Utils } from '@services/utils/utils.service';
import { toggleGifModal, closeModal, addPostFeeling } from '@redux/reducers/modal/modalSlice';
import type { RootState, AppDispatch } from '@redux/store';
import type { FeelingItem } from '@services/utils/static.data';
import './EditPost.scss';

const EditPost = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { gifModalIsOpen, feeling } = useSelector((state: RootState) => state.modal);
  const postState = useSelector((state: RootState) => state.post);
  const { profile } = useSelector((state: RootState) => state.user);
  const [loading, setLoading] = useState(false);
  const [postImage, setPostImage] = useState('');
  const [hasVideo, setHasVideo] = useState(false);
  const [allowedNumberOfCharacters, setAllowedNumberOfCharacters] = useState('100/100');
  const [textAreaBackground, setTextAreaBackground] = useState('#ffffff');
  const [postData, setPostData] = useState({
    post: '',
    bgColor: '#ffffff',
    privacy: '',
    feelings: '',
    gifUrl: '',
    profilePicture: '',
    image: '',
    imgId: '',
    imgVersion: '',
    video: '',
    videoId: '',
    videoVersion: ''
  });
  const [disable, setDisable] = useState(true);
  const [apiResponse, setApiResponse] = useState('');
  const [selectedPostImage, setSelectedPostImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLDivElement>(null);
  const inputFocusedRef = useRef(false);
  const imageInputFocusedRef = useRef(false);
  const maxNumberOfCharacters = 100;

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const element = event.currentTarget as HTMLDivElement;
    // Ensure LTR direction (only set dir attribute)
    element.setAttribute('dir', 'ltr');
    
    const currentTextLength = element.textContent?.length || 0;
    if (currentTextLength === maxNumberOfCharacters && event.keyCode !== 8) {
      event.preventDefault();
    }
  };

  const onBeforeInput = (event: React.FormEvent<HTMLDivElement>) => {
    const element = event.currentTarget as HTMLDivElement;
    // Ensure LTR before input (only set dir attribute)
    element.setAttribute('dir', 'ltr');
    
    // Get current selection and ensure parent has LTR
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      if (container.nodeType === Node.TEXT_NODE && container.parentNode) {
        (container.parentNode as HTMLElement).setAttribute('dir', 'ltr');
      } else if (container.nodeType === Node.ELEMENT_NODE) {
        (container as HTMLElement).setAttribute('dir', 'ltr');
      }
    }
  };

  const postInputEditable = (event: React.FormEvent<HTMLDivElement>, textContent: string) => {
    const element = event.currentTarget as HTMLDivElement;
    
    // Ensure direction stays LTR (only set dir attribute, CSS handles the rest)
    element.setAttribute('dir', 'ltr');
    
    const currentTextLength = element.textContent?.length || 0;
    const counter = maxNumberOfCharacters - currentTextLength;
    if (counterRef.current) {
      counterRef.current.textContent = `${counter}/${maxNumberOfCharacters}`;
    }
    setAllowedNumberOfCharacters(`${counter}/${maxNumberOfCharacters}`);
    // Allow posting if there's text OR an image/gif/video
    const hasContent = currentTextLength > 0 || postImage || postData.gifUrl || postData.image || postData.video || selectedPostImage || selectedVideo;
    setDisable(!hasContent);
    // Update postData without causing re-render during typing - use functional update
    setPostData((prevData) => {
      if (prevData.post !== textContent) {
        return { ...prevData, post: textContent };
      }
      return prevData;
    });
  };

  const clearImage = () => {
    setSelectedVideo(null);
    setHasVideo(false);
    const postDataForUtils = { ...postData } as { post: string; bgColor: string; privacy: string; feelings: string; gifUrl: string; profilePicture: string; image: string; video: string };
    PostUtils.clearImage(postDataForUtils, postState.post || '', inputRef, dispatch, setSelectedPostImage, setPostImage, setDisable, (data) => {
      setPostData((prev) => ({ ...prev, ...data }));
    });
  };

  const getFeeling = useCallback(
    (name: string) => {
      const feelingItem = find(feelingsList, (data: FeelingItem) => data.name === name);
      if (feelingItem) {
        dispatch(addPostFeeling({ feeling: feelingItem.name }));
      }
    },
    [dispatch]
  );

  const postInputData = useCallback(() => {
    setTimeout(() => {
      if (imageInputRef?.current) {
        setPostData((prevData) => {
          const updatedData = { ...prevData, post: postState.post || '' };
          if (imageInputRef.current) {
            // Ensure contentEditable is set before setting textContent
            imageInputRef.current.setAttribute('contenteditable', 'true');
            imageInputRef.current.contentEditable = 'true';
            imageInputRef.current.setAttribute('dir', 'ltr');
            imageInputRef.current.removeAttribute('readonly');
            imageInputRef.current.removeAttribute('disabled');
            imageInputRef.current.style.pointerEvents = 'auto';
            imageInputRef.current.style.userSelect = 'text';
            imageInputRef.current.style.cursor = 'text';
            // Only update if the element is not currently being edited
            const isFocused = document.activeElement === imageInputRef.current;
            if (!isFocused) {
              // Only set textContent if it's different to avoid cursor issues
              const currentText = imageInputRef.current.textContent || '';
              if (currentText !== (postState.post || '')) {
                imageInputRef.current.textContent = postState.post || '';
              }
            }
          }
          return updatedData;
        });
      }
    }, 0);
  }, [postState.post]);

  const editableFields = useCallback(() => {
    if (postState.feelings) {
      getFeeling(postState.feelings);
    }
    if (postState.bgColor) {
      setPostData((prevData) => ({ ...prevData, bgColor: postState.bgColor }));
      setTextAreaBackground(postState.bgColor);
      setTimeout(() => {
        if (inputRef?.current) {
          // Only update if the element is not currently being edited
          const isFocused = document.activeElement === inputRef.current;
          if (!isFocused) {
            setPostData((prevData) => {
              const updatedData = { ...prevData, post: postState.post || '' };
              if (inputRef.current) {
                // Ensure contentEditable is set before setting textContent
                inputRef.current.setAttribute('contenteditable', 'true');
                inputRef.current.contentEditable = 'true';
                inputRef.current.setAttribute('dir', 'ltr');
                inputRef.current.removeAttribute('readonly');
                inputRef.current.removeAttribute('disabled');
                inputRef.current.style.pointerEvents = 'auto';
                inputRef.current.style.userSelect = 'text';
                inputRef.current.style.cursor = 'text';
                // Only set textContent if it's different to avoid cursor issues
                const currentText = inputRef.current.textContent || '';
                if (currentText !== (postState.post || '')) {
                  inputRef.current.textContent = postState.post || '';
                }
              }
              return updatedData;
            });
          }
        }
      }, 0);
    }
    const postStateWithExtras2 = postState as { imgId?: string; imgVersion?: string; videoId?: string; videoVersion?: string };
    if (postState.gifUrl && !postState.imgId && !postStateWithExtras2.videoId) {
      setPostData((prevData) => ({
        ...prevData,
        gifUrl: postState.gifUrl,
        videoId: '',
        videoVersion: '',
        imgId: '',
        imgVersion: '',
        video: '',
        image: ''
      }));
      setPostImage(postState.gifUrl);
      setHasVideo(false);
      postInputData();
    }
    if (postState.imgId && !postState.gifUrl) {
      const postStateWithExtras = postState as { imgId?: string; imgVersion?: string; videoId?: string; videoVersion?: string };
      setPostData((prevData) => ({
        ...prevData,
        imgId: postStateWithExtras.imgId || '',
        imgVersion: postStateWithExtras.imgVersion || '',
        videoId: '',
        videoVersion: ''
      }));
      const imageUrl = Utils.getImage(postStateWithExtras.imgId || '', postStateWithExtras.imgVersion || '');
      setPostImage(imageUrl);
      setHasVideo(false);
      postInputData();
    }
    const postStateWithExtras = postState as { imgId?: string; imgVersion?: string; videoId?: string; videoVersion?: string };
    if (postStateWithExtras.videoId && !postState.imgId && !postState.gifUrl) {
      setPostData((prevData) => ({
        ...prevData,
        videoId: postStateWithExtras.videoId || '',
        videoVersion: postStateWithExtras.videoVersion || ''
      }));
      const videoUrl = Utils.getVideo(postStateWithExtras.videoId || '', postStateWithExtras.videoVersion || '');
      setPostImage(videoUrl);
      setHasVideo(true);
      postInputData();
    }
  }, [postState, getFeeling, postInputData]);

  const updatePost = async () => {
    setLoading(!loading);
    setDisable(!disable);
    try {
      const updatedPostData = { ...postData };
      if (Object.keys(feeling || {}).length) {
        updatedPostData.feelings = (feeling as { name?: string })?.name || '';
      }
      if (updatedPostData.gifUrl || (updatedPostData.imgId && updatedPostData.imgVersion)) {
        updatedPostData.bgColor = '#ffffff';
      }
      updatedPostData.privacy = postState.privacy || 'Public';
      updatedPostData.profilePicture = profile?.profilePicture || '';
      if (selectedPostImage || selectedVideo) {
        let result = '';
        if (selectedPostImage) {
          result = await ImageUtils.readAsBase64(selectedPostImage);
        }
        if (selectedVideo) {
          result = await ImageUtils.readAsBase64(selectedVideo);
          setHasVideo(true);
        }
        const type = selectedPostImage ? 'image' : 'video';
        if (type === 'image') {
          updatedPostData.image = result;
          updatedPostData.video = '';
          setHasVideo(false);
        } else {
          updatedPostData.image = '';
          updatedPostData.video = result;
          setHasVideo(true);
        }
        updatedPostData.gifUrl = '';
        updatedPostData.imgId = '';
        updatedPostData.imgVersion = '';
        updatedPostData.videoId = '';
        updatedPostData.videoVersion = '';
        await PostUtils.sendUpdatePostWithFileRequest(
          type,
          postState._id || '',
          updatedPostData,
          setApiResponse,
          setLoading,
          dispatch
        );
      } else {
        await PostUtils.sendUpdatePostRequest(
          postState._id || '',
          updatedPostData,
          setApiResponse,
          setLoading,
          setDisable,
          dispatch
        );
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      PostUtils.dispatchNotification(
        axiosError.response?.data?.message || 'An error occurred',
        'error',
        setApiResponse,
        setLoading,
        setDisable,
        dispatch
      );
    }
  };


  useEffect(() => {
    // Reset focus refs when postState changes to allow re-focusing
    if (postState.post) {
      inputFocusedRef.current = false;
      imageInputFocusedRef.current = false;
    }
    // Ensure contentEditable is always set on editable elements
    const timeoutId = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.contentEditable = 'true';
        inputRef.current.setAttribute('contenteditable', 'true');
        inputRef.current.removeAttribute('readonly');
        inputRef.current.removeAttribute('disabled');
        inputRef.current.style.pointerEvents = 'auto';
        inputRef.current.style.userSelect = 'text';
        inputRef.current.style.cursor = 'text';
        inputRef.current.style.webkitUserSelect = 'text';
        // Set vendor prefixes using setProperty for TypeScript compatibility
        inputRef.current.style.setProperty('-moz-user-select', 'text');
        inputRef.current.style.setProperty('-ms-user-select', 'text');
        // Force a reflow to ensure the attribute is applied
        void inputRef.current.offsetHeight;
      }
      if (imageInputRef.current) {
        imageInputRef.current.contentEditable = 'true';
        imageInputRef.current.setAttribute('contenteditable', 'true');
        imageInputRef.current.removeAttribute('readonly');
        imageInputRef.current.removeAttribute('disabled');
        imageInputRef.current.style.pointerEvents = 'auto';
        imageInputRef.current.style.userSelect = 'text';
        imageInputRef.current.style.cursor = 'text';
        imageInputRef.current.style.webkitUserSelect = 'text';
        // Set vendor prefixes using setProperty for TypeScript compatibility
        imageInputRef.current.style.setProperty('-moz-user-select', 'text');
        imageInputRef.current.style.setProperty('-ms-user-select', 'text');
        // Force a reflow to ensure the attribute is applied
        void imageInputRef.current.offsetHeight;
      }
      // Position cursor after ensuring contentEditable is set (only if not focused)
      if (document.activeElement?.id !== 'editable' && document.activeElement?.getAttribute('data-testid') !== 'post-editable') {
        PostUtils.positionCursor('editable');
      }
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [postState]);


  useEffect(() => {
    if (!loading && apiResponse === 'success') {
      dispatch(closeModal());
    }
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      // Allow posting if there's text OR an image/gif/video
      const hasContent = postData.post.length > 0 || postImage || postData.gifUrl || postData.image || postData.video || selectedPostImage || selectedVideo;
      setDisable(!hasContent);
    }, 0);
  }, [loading, dispatch, apiResponse, postData, postImage, selectedPostImage, selectedVideo]);

  useEffect(() => {
    setTimeout(() => {
      if (imageInputRef?.current && imageInputRef?.current.textContent?.length) {
        if (counterRef.current) {
          counterRef.current.textContent = `${maxNumberOfCharacters - imageInputRef.current.textContent.length}/100`;
        }
      } else if (inputRef?.current && inputRef?.current.textContent?.length) {
        if (counterRef.current) {
          counterRef.current.textContent = `${maxNumberOfCharacters - inputRef.current.textContent.length}/100`;
        }
      }
    }, 0);
  }, []);

  useEffect(() => {
    if (postState.gifUrl) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setPostData((prevData) => ({ ...prevData, image: '' }));
        setSelectedPostImage(null);
        setPostImage(postState.gifUrl);
        setHasVideo(false);
        const postDataForUtils = { ...postData } as { post: string; bgColor: string; privacy: string; feelings: string; gifUrl: string; profilePicture: string; image: string; video: string };
        PostUtils.postInputData(imageInputRef, postDataForUtils, postState.post || '', (data) => {
          setPostData((prev) => ({ ...prev, ...data }));
        });
      }, 0);
    } else if (postState.image) {
      setTimeout(() => {
        setPostImage(postState.image);
        setHasVideo(false);
        const postDataForUtils2 = { ...postData } as { post: string; bgColor: string; privacy: string; feelings: string; gifUrl: string; profilePicture: string; image: string; video: string };
        PostUtils.postInputData(imageInputRef, postDataForUtils2, postState.post || '', (data) => {
          setPostData((prev) => ({ ...prev, ...data }));
        });
      }, 0);
    }
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      editableFields();
    }, 0);
  }, [editableFields, postState, postData]);

  return (
    <>
      <PostWrapper>
        <div></div>
        {!gifModalIsOpen && (
          <div
            className="modal-box"
            style={{
              height: selectedPostImage || postState.gifUrl || postState.imgId || postData?.gifUrl || postData?.image ? '700px' : 'auto'
            }}
          >
            {loading && (
              <div className="modal-box-loading" data-testid="modal-box-loading">
                <span>Updating post...</span>
                <Spinner />
              </div>
            )}
            <div className="modal-box-header">
              <h2>Edit Post</h2>
              <button className="modal-box-header-cancel" onClick={() => PostUtils.closePostModal(dispatch)}>
                X
              </button>
            </div>
            <hr />
            <ModalBoxContent />
            {!postImage && (
              <>
                <div
                  className="modal-box-form"
                  data-testid="modal-box-form"
                  style={{ background: `${textAreaBackground}` }}
                >
                  <div
                    className="main"
                    style={{ margin: textAreaBackground !== '#ffffff' ? '0 auto' : '' }}
                  >
                    <div className="flex-row">
                      <div
                        ref={(el) => {
                          inputRef.current = el;
                          if (el) {
                            // Always ensure contentEditable is set
                            el.setAttribute('dir', 'ltr');
                            el.setAttribute('contenteditable', 'true');
                            el.contentEditable = 'true';
                            el.style.pointerEvents = 'auto';
                            el.style.userSelect = 'text';
                            el.style.cursor = 'text';
                            el.removeAttribute('readonly');
                            el.removeAttribute('disabled');
                            // Only focus on initial mount, not on every re-render
                            if (!inputFocusedRef.current) {
                              inputFocusedRef.current = true;
                              requestAnimationFrame(() => {
                                if (inputRef.current) {
                                  inputRef.current.focus();
                                }
                              });
                            }
                          }
                        }}
                        id="editable"
                        data-testid="editable"
                        className={`editable flex-item ${textAreaBackground !== '#ffffff' ? 'textInputColor' : ''} ${postData.post.length === 0 && textAreaBackground !== '#ffffff' ? 'defaultInputTextColor' : ''}`}
                        contentEditable="true"
                        dir="ltr"
                        data-placeholder="What's on your mind?..."
                        onBeforeInput={onBeforeInput}
                        onInput={(e) => {
                          // Save cursor position BEFORE any DOM manipulation
                          const selection = window.getSelection();
                          let savedRange: Range | null = null;
                          let savedOffset = 0;
                          if (selection && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            savedRange = range.cloneRange();
                            // Also save the offset in case the range becomes invalid
                            savedOffset = range.startOffset;
                          }
                          
                          const element = e.currentTarget as HTMLDivElement;
                          // Ensure LTR direction (only set dir attribute, CSS handles styling)
                          element.setAttribute('dir', 'ltr');
                          // Ensure contentEditable is still set
                          element.setAttribute('contenteditable', 'true');
                          element.contentEditable = 'true';
                          
                          const textContent = element.textContent || '';
                          postInputEditable(e, textContent);
                          
                          // Restore cursor position after state updates complete using requestAnimationFrame
                          requestAnimationFrame(() => {
                            if (selection && textContent.length > 0) {
                              try {
                                // Try to restore the original range first
                                if (savedRange && savedRange.startContainer && savedRange.startContainer.parentNode) {
                                  selection.removeAllRanges();
                                  selection.addRange(savedRange);
                                } else {
                                  // Fallback: restore by offset
                                  const textNode = element.firstChild;
                                  if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                                    const range = document.createRange();
                                    const offset = Math.min(savedOffset + 1, textNode.textContent?.length || 0);
                                    range.setStart(textNode, offset);
                                    range.collapse(true);
                                    selection.removeAllRanges();
                                    selection.addRange(range);
                                  }
                                }
                              } catch {
                                // If restoring fails, just ensure cursor is at end
                                const range = document.createRange();
                                range.selectNodeContents(element);
                                range.collapse(false);
                                selection.removeAllRanges();
                                selection.addRange(range);
                              }
                            }
                          });
                        }}
                        onFocus={(e) => {
                          const element = e.currentTarget as HTMLDivElement;
                          element.setAttribute('dir', 'ltr');
                          element.setAttribute('contenteditable', 'true');
                          element.contentEditable = 'true';
                          element.style.pointerEvents = 'auto';
                          element.style.userSelect = 'text';
                          element.style.cursor = 'text';
                        }}
                        onKeyDown={onKeyDown}
                      ></div>
                    </div>
                  </div>
                </div>
              </>
            )}
            {postImage && (
              <>
                <div className="modal-box-image-form">
                  <div
                    ref={(el) => {
                      imageInputRef.current = el;
                      if (el) {
                        // Always ensure contentEditable is set
                        el.setAttribute('dir', 'ltr');
                        el.setAttribute('contenteditable', 'true');
                        el.contentEditable = 'true';
                        el.style.pointerEvents = 'auto';
                        el.style.userSelect = 'text';
                        el.style.cursor = 'text';
                        el.removeAttribute('readonly');
                        el.removeAttribute('disabled');
                        // Only focus on initial mount, not on every re-render
                        if (!imageInputFocusedRef.current) {
                          imageInputFocusedRef.current = true;
                          // Use a small delay to ensure DOM is ready
                          requestAnimationFrame(() => {
                            if (imageInputRef.current) {
                              imageInputRef.current.focus();
                              // Position cursor at the start (left side) only on initial mount
                              const selection = window.getSelection();
                              if (selection) {
                                const range = document.createRange();
                                if (imageInputRef.current.firstChild && imageInputRef.current.firstChild.nodeType === Node.TEXT_NODE) {
                                  range.setStart(imageInputRef.current.firstChild, 0);
                                } else {
                                  range.setStart(imageInputRef.current, 0);
                                }
                                range.collapse(true);
                                selection.removeAllRanges();
                                selection.addRange(range);
                              }
                            }
                          });
                        }
                      }
                    }}
                    data-testid="post-editable"
                    className="post-input flex-item"
                    contentEditable="true"
                    dir="ltr"
                    data-placeholder="What's on your mind?..."
                    onBeforeInput={onBeforeInput}
                    onInput={(e) => {
                      // Save cursor position BEFORE any DOM manipulation
                      const selection = window.getSelection();
                      let savedRange: Range | null = null;
                      let savedOffset = 0;
                      if (selection && selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        savedRange = range.cloneRange();
                        // Also save the offset in case the range becomes invalid
                        savedOffset = range.startOffset;
                      }
                      
                      const element = e.currentTarget as HTMLDivElement;
                      // Ensure LTR direction (only set dir attribute, CSS handles styling)
                      element.setAttribute('dir', 'ltr');
                      // Ensure contentEditable is still set
                      element.setAttribute('contenteditable', 'true');
                      element.contentEditable = 'true';
                      
                      const textContent = element.textContent || '';
                      postInputEditable(e, textContent);
                      
                      // Restore cursor position after state updates complete using requestAnimationFrame
                      requestAnimationFrame(() => {
                        if (selection && textContent.length > 0) {
                          try {
                            // Try to restore the original range first
                            if (savedRange && savedRange.startContainer && savedRange.startContainer.parentNode) {
                              selection.removeAllRanges();
                              selection.addRange(savedRange);
                            } else {
                              // Fallback: restore by offset
                              const textNode = element.firstChild;
                              if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                                const range = document.createRange();
                                const offset = Math.min(savedOffset + 1, textNode.textContent?.length || 0);
                                range.setStart(textNode, offset);
                                range.collapse(true);
                                selection.removeAllRanges();
                                selection.addRange(range);
                              }
                            }
                          } catch {
                            // If restoring fails, just ensure cursor is at end
                            const range = document.createRange();
                            range.selectNodeContents(element);
                            range.collapse(false);
                            selection.removeAllRanges();
                            selection.addRange(range);
                          }
                        }
                      });
                    }}
                    onFocus={(e) => {
                      const element = e.currentTarget as HTMLDivElement;
                      element.setAttribute('dir', 'ltr');
                      element.setAttribute('contenteditable', 'true');
                      element.contentEditable = 'true';
                      element.style.pointerEvents = 'auto';
                      element.style.userSelect = 'text';
                      element.style.cursor = 'text';
                    }}
                    onKeyDown={onKeyDown}
                  ></div>
                  <div className="image-display">
                    <div className="image-delete-btn" data-testid="image-delete-btn" onClick={() => clearImage()}>
                      <FaTimes />
                    </div>
                    {hasVideo ? (
                      <div style={{ marginTop: '-40px' }}>
                        <video width="100%" controls src={postImage} />
                      </div>
                    ) : (
                      <img data-testid="post-image" className="post-image" src={`${postImage}`} alt="" />
                    )}
                  </div>
                </div>
              </>
            )}
            <div className="modal-box-bg-colors">
              <ul>
                {bgColors.map((color, index) => (
                  <li
                    data-testid="bg-colors"
                    key={index}
                    className={`${color === '#ffffff' ? 'whiteColorBorder' : ''}`}
                    style={{ backgroundColor: `${color}` }}
                    onClick={() => {
                      setPostData((prevData) => ({ ...prevData, bgColor: color }));
                      setTextAreaBackground(color);
                      setDisable(false);
                    }}
                  ></li>
                ))}
              </ul>
            </div>
            <span className="char_count" data-testid="allowed-number" ref={counterRef}>
              {allowedNumberOfCharacters}
            </span>
            <ModalBoxSelection setSelectedPostImage={setSelectedPostImage} setSelectedVideo={setSelectedVideo} />
            <div className="modal-box-button" data-testid="post-button">
              <Button label="Update Post" className="post-button" disabled={disable} handleClick={updatePost} />
            </div>
          </div>
        )}
        {gifModalIsOpen && (
          <div className="modal-giphy" data-testid="modal-giphy">
            <div className="modal-giphy-header">
              <Button
                label={<FaArrowLeft />}
                className="back-button"
                disabled={false}
                handleClick={() => dispatch(toggleGifModal(!gifModalIsOpen))}
              />
              <h2>Choose a GIF</h2>
            </div>
            <hr />
            <Giphy />
          </div>
        )}
      </PostWrapper>
    </>
  );
};

export default EditPost;

