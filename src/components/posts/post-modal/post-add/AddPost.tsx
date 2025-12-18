import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { FaTimes, FaArrowLeft } from 'react-icons/fa';
import PostWrapper from '@components/posts/modal-wrappers/post-wrapper/PostWrapper';
import ModalBoxContent from '@components/posts/post-modal/modal-box-content/ModalBoxContent';
import ModalBoxSelection from '@components/posts/post-modal/modal-box-content/ModalBoxSelection';
import Giphy from '@components/giphy/Giphy';
import Button from '@components/button/Button';
import { bgColors } from '@services/utils/static.data';
import { PostUtils } from '@services/utils/post-utils.service';
import { ImageUtils } from '@services/utils/image-utils.service';
import { postService } from '@services/api/post/post.service';
import { toggleGifModal, closeModal } from '@redux/reducers/modal/modalSlice';
import Spinner from '@components/spinner/Spinner';
import type { RootState, AppDispatch } from '@redux/store';
import './AddPost.scss';

interface AddPostProps {
  selectedImage?: File | null;
  selectedPostVideo?: File | null;
}

const AddPost = ({ selectedImage, selectedPostVideo }: AddPostProps) => {
  const { gifModalIsOpen, feeling } = useSelector((state: RootState) => state.modal);
  const { gifUrl, image, privacy, video } = useSelector((state: RootState) => state.post);
  const { profile } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [postImage, setPostImage] = useState('');
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
    video: ''
  });
  const [disable, setDisable] = useState(true);
  const [apiResponse, setApiResponse] = useState('');
  const [selectedPostItem, setSelectedPostImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLDivElement>(null);
  const inputFocusedRef = useRef(false);
  const imageInputFocusedRef = useRef(false);
  const maxNumberOfCharacters = 100;

  const selectBackground = (bgColor: string) => {
    console.log(selectedPostItem);
    console.log(selectedImage);
    PostUtils.selectBackground(bgColor, postData, setTextAreaBackground, setPostData, setDisable);
    // Allow posting if there's text OR an image/gif/video (background color selection enables posting)
    const hasContent = (postData.post || '').length > 0 || postImage || gifUrl || image || video || selectedPostItem || selectedVideo || selectedImage || selectedPostVideo;
    setDisable(!hasContent);
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
    const hasContent = currentTextLength > 0 || postImage || postData.gifUrl || postData.image || postData.video || selectedPostItem || selectedVideo;
    setDisable(!hasContent);
    // Update postData without causing re-render during typing - use functional update
    setPostData((prevData) => {
      if (prevData.post !== textContent) {
        return { ...prevData, post: textContent };
      }
      return prevData;
    });
  };


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
      if (container.nodeType === Node.ELEMENT_NODE) {
        (container as Element).setAttribute('dir', 'ltr');
      } else if (container.parentElement) {
        container.parentElement.setAttribute('dir', 'ltr');
      }
    }
  };

  const closePostModal = () => {
    PostUtils.closePostModal(dispatch);
  };

  const clearImage = () => {
    PostUtils.clearImage(
      postData,
      '',
      inputRef,
      dispatch,
      setSelectedPostImage,
      setPostImage,
      setDisable,
      setPostData
    );
    setHasVideo(false);
    setSelectedVideo(null);
  };

  const createPost = async () => {
    setLoading(!loading);
    setDisable(!disable);
    try {
      const updatedPostData = { ...postData };
      if (feeling) {
        updatedPostData.feelings = feeling;
      }
      updatedPostData.privacy = privacy || 'Public';
      updatedPostData.gifUrl = gifUrl || '';
      updatedPostData.profilePicture = profile?.profilePicture || '';
      if (postImage) {
        updatedPostData.post = imageInputRef.current?.textContent || updatedPostData.post || '';
      } else {
        updatedPostData.post = inputRef.current?.textContent || updatedPostData.post || '';
      }
      if (selectedPostItem || selectedImage || selectedVideo || selectedPostVideo) {
        let result = '';
        if (selectedPostItem) {
          result = await ImageUtils.readAsBase64(selectedPostItem);
        }
        if (selectedImage) {
          result = await ImageUtils.readAsBase64(selectedImage);
        }
        if (selectedVideo) {
          result = await ImageUtils.readAsBase64(selectedVideo);
        }
        if (selectedPostVideo) {
          result = await ImageUtils.readAsBase64(selectedPostVideo);
        }
        const type = selectedPostItem || selectedImage ? 'image' : 'video';
        if (type === 'image') {
          updatedPostData.image = result;
          updatedPostData.video = '';
        } else {
          updatedPostData.image = '';
          updatedPostData.video = result;
        }
        const response = await PostUtils.sendPostWithFileRequest(
          type,
          updatedPostData,
          imageInputRef,
          setApiResponse,
          setLoading,
          setDisable,
          dispatch
        );
        if (response && response?.data?.message) {
          PostUtils.closePostModal(dispatch);
        }
      } else {
        const response = await postService.createPost(updatedPostData);
        if (response) {
          setApiResponse('success');
          setLoading(false);
          PostUtils.closePostModal(dispatch);
        }
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      PostUtils.dispatchNotification(
        axiosError?.response?.data?.message || 'An error occurred',
        'error',
        setApiResponse,
        setLoading,
        setDisable,
        dispatch
      );
    }
  };

  useEffect(() => {
    PostUtils.positionCursor('editable');
    
    // Watch for direction changes and force LTR (only watch attributes, not content changes)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'dir') {
          const target = mutation.target as HTMLElement;
          if (target.getAttribute('dir') !== 'ltr') {
            target.setAttribute('dir', 'ltr');
          }
        }
      });
    });
    
    // Observe both input elements (only attributes, not content changes to avoid cursor issues)
    [inputRef.current, imageInputRef.current].forEach((el) => {
      if (el) {
        observer.observe(el, {
          attributes: true,
          attributeFilter: ['dir'],
          subtree: true
        });
      }
    });
    
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!loading && apiResponse === 'success') {
      dispatch(closeModal());
    }
  }, [loading, dispatch, apiResponse]);

  useEffect(() => {
    if (gifUrl) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setPostImage(gifUrl);
        setHasVideo(false);
        PostUtils.postInputData(imageInputRef, postData, '', setPostData);
        // Allow posting if there's text OR an image/gif/video
        const hasContent = (postData.post || '').length > 0 || gifUrl || image || video || selectedPostItem || selectedVideo || selectedImage || selectedPostVideo;
        setDisable(!hasContent);
      }, 0);
    } else if (image) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setPostImage(image);
        setHasVideo(false);
        PostUtils.postInputData(imageInputRef, postData, '', setPostData);
        // Allow posting if there's text OR an image/gif/video
        const hasContent = (postData.post || '').length > 0 || gifUrl || image || video || selectedPostItem || selectedVideo || selectedImage || selectedPostVideo;
        setDisable(!hasContent);
      }, 0);
    } else if (video) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setHasVideo(true);
        setPostImage(video);
        PostUtils.postInputData(imageInputRef, postData, '', setPostData);
        // Allow posting if there's text OR an image/gif/video
        const hasContent = (postData.post || '').length > 0 || gifUrl || image || video || selectedPostItem || selectedVideo || selectedImage || selectedPostVideo;
        setDisable(!hasContent);
      }, 0);
    }
    // Also check when selectedPostItem, selectedVideo, selectedImage, or selectedPostVideo changes
    // Allow posting if there's text OR an image/gif/video
    // Use setTimeout to avoid calling setState synchronously in effect
    setTimeout(() => {
      const hasContent = (postData.post || '').length > 0 || postImage || gifUrl || image || video || selectedPostItem || selectedVideo || selectedImage || selectedPostVideo;
      setDisable(!hasContent);
    }, 0);
  }, [gifUrl, image, video, postData, postImage, selectedPostItem, selectedVideo, selectedImage, selectedPostVideo]);

  return (
    <>
      <PostWrapper>
        <div></div>
        {!gifModalIsOpen && (
          <div
            className="modal-box"
            style={{
              height: selectedPostItem || gifUrl || image || postData?.gifUrl || postData?.image || video ? '700px' : 'auto'
            }}
          >
            {loading && (
              <div className="modal-box-loading" data-testid="modal-box-loading">
                <span>Posting...</span>
                <Spinner />
              </div>
            )}
            <div className="modal-box-header">
              <h2>Create Post</h2>
              <button className="modal-box-header-cancel" onClick={closePostModal}>
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
                            el.setAttribute('dir', 'ltr');
                            // Only focus on initial mount, not on every re-render
                            if (!inputFocusedRef.current) {
                              inputFocusedRef.current = true;
                              requestAnimationFrame(() => {
                                inputRef?.current?.focus();
                              });
                            }
                          }
                        }}
                        id="editable"
                        data-testid="editable"
                        className={`editable flex-item ${textAreaBackground !== '#ffffff' ? 'textInputColor' : ''} ${postData.post.length === 0 && textAreaBackground !== '#ffffff' ? 'defaultInputTextColor' : ''}`}
                        contentEditable={true}
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
                            // Final fallback: position at end
                            const range = document.createRange();
                            range.selectNodeContents(element);
                            range.collapse(false);
                            selection.removeAllRanges();
                            selection.addRange(range);
                          }
                        }
                      });
                    }}
                    onKeyDown={onKeyDown}
                    onFocus={(e) => {
                      const element = e.currentTarget as HTMLDivElement;
                      element.setAttribute('dir', 'ltr');
                      
                      // Position cursor at start if empty
                      if (!element.textContent || element.textContent.length === 0) {
                        setTimeout(() => {
                          const selection = window.getSelection();
                          if (selection) {
                            const range = document.createRange();
                            range.setStart(element, 0);
                            range.collapse(true);
                            selection.removeAllRanges();
                            selection.addRange(range);
                          }
                        }, 0);
                      }
                    }}
                    onKeyPress={(e) => {
                      const element = e.currentTarget as HTMLDivElement;
                      element.setAttribute('dir', 'ltr');
                    }}
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
                        el.setAttribute('dir', 'ltr');
                        el.setAttribute('contenteditable', 'true');
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
                    contentEditable={true}
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
                            // Final fallback: position at end
                            const range = document.createRange();
                            range.selectNodeContents(element);
                            range.collapse(false);
                            selection.removeAllRanges();
                            selection.addRange(range);
                          }
                        }
                      });
                    }}
                    onKeyDown={onKeyDown}
                    onFocus={(e) => {
                      const element = e.currentTarget as HTMLDivElement;
                      element.setAttribute('dir', 'ltr');
                      
                      // Position cursor at start if empty
                      if (!element.textContent || element.textContent.length === 0) {
                        setTimeout(() => {
                          const selection = window.getSelection();
                          if (selection) {
                            const range = document.createRange();
                            range.setStart(element, 0);
                            range.collapse(true);
                            selection.removeAllRanges();
                            selection.addRange(range);
                          }
                        }, 0);
                      }
                    }}
                    onKeyPress={(e) => {
                      const element = e.currentTarget as HTMLDivElement;
                      element.setAttribute('dir', 'ltr');
                    }}
                  ></div>
                  <div className="image-display">
                    <div className="image-delete-btn" data-testid="image-delete-btn" style={{ marginTop: '-40px' }} onClick={() => clearImage()}>
                      <FaTimes />
                    </div>
                    {!hasVideo && <img data-testid="post-image" className="post-image" src={`${postImage}`} alt="" />}
                    {hasVideo && (
                      <div style={{ marginTop: '-40px' }}>
                        <video width="100%" controls src={`${video}`} />
                      </div>
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
                    onClick={() => selectBackground(color)}
                  ></li>
                ))}
              </ul>
            </div>
            <span className="char_count" data-testid="allowed-number" ref={counterRef}>
              {allowedNumberOfCharacters}
            </span>
            <ModalBoxSelection setSelectedPostImage={setSelectedPostImage} setSelectedVideo={setSelectedVideo} />
            <div className="modal-box-button" data-testid="post-button">
              <Button label="Create Post" className="post-button" disabled={disable} handleClick={createPost} />
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

AddPost.propTypes = {
  selectedImage: PropTypes.any,
  selectedPostVideo: PropTypes.any
};

export default AddPost;

