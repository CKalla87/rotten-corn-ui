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
  const maxNumberOfCharacters = 100;

  const selectBackground = (bgColor: string) => {
    console.log(selectedPostItem);
    console.log(selectedImage);
    PostUtils.selectBackground(bgColor, postData, setTextAreaBackground, setPostData, setDisable);
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
    setDisable(currentTextLength <= 0 && !postImage);
    PostUtils.postInputEditable(textContent, postData, setPostData, setDisable);
    // Don't touch the cursor here - let the onInput handler manage it
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
    
    // Watch for direction changes and force LTR
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'dir') {
          const target = mutation.target as HTMLElement;
          if (target.getAttribute('dir') !== 'ltr') {
            target.setAttribute('dir', 'ltr');
          }
        } else if (mutation.type === 'childList' || mutation.type === 'characterData') {
          // Check all contentEditable elements
          [inputRef.current, imageInputRef.current].forEach((el) => {
            if (el && el.getAttribute('dir') !== 'ltr') {
              el.setAttribute('dir', 'ltr');
            }
          });
        }
      });
    });
    
    // Observe both input elements
    [inputRef.current, imageInputRef.current].forEach((el) => {
      if (el) {
        observer.observe(el, {
          attributes: true,
          attributeFilter: ['dir', 'style'],
          childList: true,
          characterData: true,
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
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setDisable(postData.post.length <= 0 && !postImage);
    }, 0);
  }, [loading, dispatch, apiResponse, postData, postImage]);

  useEffect(() => {
    if (gifUrl) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setPostImage(gifUrl);
        setHasVideo(false);
        PostUtils.postInputData(imageInputRef, postData, '', setPostData);
      }, 0);
    } else if (image) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setPostImage(image);
        setHasVideo(false);
        PostUtils.postInputData(imageInputRef, postData, '', setPostData);
      }, 0);
    } else if (video) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setHasVideo(true);
        setPostImage(video);
        PostUtils.postInputData(imageInputRef, postData, '', setPostData);
      }, 0);
    }
  }, [gifUrl, image, video, postData]);

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
                            inputRef?.current?.focus();
                          }
                        }}
                        id="editable"
                        data-testid="editable"
                        name="post"
                        className={`editable flex-item ${textAreaBackground !== '#ffffff' ? 'textInputColor' : ''} ${postData.post.length === 0 && textAreaBackground !== '#ffffff' ? 'defaultInputTextColor' : ''}`}
                        contentEditable={true}
                        dir="ltr"
                        data-placeholder="What's on your mind?..."
                        onBeforeInput={onBeforeInput}
                        onInput={(e) => {
                      // Save cursor position BEFORE any DOM manipulation
                      const selection = window.getSelection();
                      let savedRange: Range | null = null;
                      if (selection && selection.rangeCount > 0) {
                        savedRange = selection.getRangeAt(0).cloneRange();
                      }
                      
                      const element = e.currentTarget as HTMLDivElement;
                      // Ensure LTR direction (only set dir attribute, CSS handles styling)
                      element.setAttribute('dir', 'ltr');
                      
                      postInputEditable(e, element.textContent || '');
                      
                      // Restore cursor position immediately after input
                      if (savedRange && selection) {
                        try {
                          selection.removeAllRanges();
                          selection.addRange(savedRange);
                        } catch {
                          // If range is invalid, position at end
                          const range = document.createRange();
                          range.selectNodeContents(element);
                          range.collapse(false);
                          selection.removeAllRanges();
                          selection.addRange(range);
                        }
                      }
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
                        // Use a small delay to ensure DOM is ready
                        setTimeout(() => {
                          el.focus();
                          // Position cursor at the start (left side)
                          const selection = window.getSelection();
                          if (selection) {
                            const range = document.createRange();
                            if (el.firstChild && el.firstChild.nodeType === Node.TEXT_NODE) {
                              range.setStart(el.firstChild, 0);
                            } else {
                              range.setStart(el, 0);
                            }
                            range.collapse(true);
                            selection.removeAllRanges();
                            selection.addRange(range);
                          }
                        }, 10);
                      }
                    }}
                    data-testid="post-editable"
                    name="post"
                    className="post-input flex-item"
                    contentEditable={true}
                    dir="ltr"
                    data-placeholder="What's on your mind?..."
                    onBeforeInput={onBeforeInput}
                    onInput={(e) => {
                      // Save cursor position BEFORE any DOM manipulation
                      const selection = window.getSelection();
                      let savedRange: Range | null = null;
                      if (selection && selection.rangeCount > 0) {
                        savedRange = selection.getRangeAt(0).cloneRange();
                      }
                      
                      const element = e.currentTarget as HTMLDivElement;
                      // Ensure LTR direction (only set dir attribute, CSS handles styling)
                      element.setAttribute('dir', 'ltr');
                      
                      postInputEditable(e, element.textContent || '');
                      
                      // Restore cursor position immediately after input
                      if (savedRange && selection) {
                        try {
                          selection.removeAllRanges();
                          selection.addRange(savedRange);
                        } catch {
                          // If range is invalid, position at end
                          const range = document.createRange();
                          range.selectNodeContents(element);
                          range.collapse(false);
                          selection.removeAllRanges();
                          selection.addRange(range);
                        }
                      }
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

