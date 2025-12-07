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
import { postService } from '@services/api/post/post.service';
import { Utils } from '@services/utils/utils.service';
import { toggleGifModal, closeModal, addPostFeeling } from '@redux/reducers/modal/modalSlice';
import type { RootState, AppDispatch } from '@redux/store';
import type { FeelingItem } from '@services/utils/static.data';
import './EditPost.scss';

const EditPost = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { gifModalIsOpen, feeling } = useSelector((state: RootState) => state.modal);
  const { post } = useSelector((state: RootState) => state.post);
  const { profile } = useSelector((state: RootState) => state.user);
  const [loading, setLoading] = useState(false);
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
  const [hasVideo, setHasVideo] = useState(false);
  const counterRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLDivElement>(null);
  const maxNumberOfCharacters = 100;

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const currentTextLength = (event.currentTarget as HTMLDivElement).textContent?.length || 0;
    if (currentTextLength === maxNumberOfCharacters && event.keyCode !== 8) {
      event.preventDefault();
    }
  };

  const clearImage = () => {
    setSelectedVideo(null);
    setHasVideo(false);
    PostUtils.clearImage(postData, post?.post || '', inputRef, dispatch, setSelectedPostImage, setPostImage, setPostData);
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
        postData.post = post?.post || '';
        imageInputRef.current.textContent = post?.post || '';
        setPostData(postData);
      }
    }, 0);
  }, []);

  const editableFields = useCallback(() => {
    if (post?.feelings) {
      getFeeling(post.feelings);
    }
    if (post?.bgColor) {
      postData.bgColor = post.bgColor;
      setPostData({ ...postData });
      setTextAreaBackground(post.bgColor);
      setTimeout(() => {
        if (inputRef?.current) {
          postData.post = post?.post || '';
          inputRef.current.textContent = post?.post || '';
          setPostData({ ...postData });
        }
      }, 0);
    }
    if (post?.gifUrl && !post?.imgId && !post.videoId) {
      postData.gifUrl = post.gifUrl;
      postData.videoId = '';
      postData.videoVersion = '';
      postData.imgId = '';
      postData.imgVersion = '';
      postData.video = '';
      postData.image = '';
      setPostImage(post.gifUrl);
      setHasVideo(false);
      postInputData();
    }
    if (post?.imgId && !post?.gifUrl) {
      postData.imgId = post.imgId;
      postData.imgVersion = post.imgVersion || '';
      postData.videoId = '';
      postData.videoVersion = '';
      const imageUrl = Utils.getImage(post.imgId, post.imgVersion);
      setPostImage(imageUrl);
      setHasVideo(false);
      postInputData();
    }
    if (post?.videoId && !post?.imgId && !post?.gifUrl) {
      postData.videoId = post.videoId;
      postData.videoVersion = post.videoVersion || '';
      const videoUrl = Utils.getVideo(post.videoId, post.videoVersion);
      setPostImage(videoUrl);
      setHasVideo(true);
      postInputData();
    }
  }, [post, postData, getFeeling, postInputData]);

  const updatePost = async () => {
    setLoading(!loading);
    setDisable(!disable);
    try {
      if (Object.keys(feeling || {}).length) {
        postData.feelings = (feeling as { name?: string })?.name || '';
      }
      if (postData.gifUrl || (postData.imgId && postData.imgVersion)) {
        postData.bgColor = '#ffffff';
      }
      postData.privacy = post?.privacy || 'Public';
      postData.profilePicture = profile?.profilePicture || '';
      if (selectedPostImage || selectedVideo) {
        let result = '';
        if (selectedPostImage) {
          result = await ImageUtils.readAsBase64(selectedPostImage);
        }
        if (selectedVideo) {
          result = await ImageUtils.readAsBase64(selectedVideo);
        }
        const type = selectedPostImage ? 'image' : 'video';
        if (type === 'image') {
          postData.image = result;
          postData.video = '';
        } else {
          postData.image = '';
          postData.video = result;
        }
        postData.gifUrl = '';
        postData.imgId = '';
        postData.imgVersion = '';
        postData.videoId = '';
        postData.videoVersion = '';
        await PostUtils.sendUpdatePostWithFileRequest(
          type,
          post?._id || '',
          postData,
          setApiResponse,
          setLoading,
          dispatch
        );
      } else {
        await PostUtils.sendUpdatePostRequest(
          post?._id || '',
          postData,
          setApiResponse,
          setLoading,
          setDisable,
          dispatch
        );
      }
    } catch (error: any) {
      PostUtils.dispatchNotification(
        error.response?.data?.message || 'An error occurred',
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
  }, [post]);

  useEffect(() => {
    if (!loading && apiResponse === 'success') {
      dispatch(closeModal());
    }
    setDisable(postData.post.length <= 0 && !postImage);
  }, [loading, dispatch, apiResponse, postData, postImage]);

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
    if (!loading && apiResponse === 'success') {
      dispatch(closeModal());
    }
    setDisable(postData.post.length <= 0 && !postImage);
  }, [loading, dispatch, apiResponse, postData, postImage]);

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
    if (post?.gifUrl) {
      postData.image = '';
      setSelectedPostImage(null);
      setPostImage(post.gifUrl);
      PostUtils.postInputData(imageInputRef, postData, post?.post || '', setPostData);
    } else if (post?.image) {
      setPostImage(post.image);
      PostUtils.postInputData(imageInputRef, postData, post?.post || '', setPostData);
    }
    editableFields();
  }, [editableFields, post, postData]);

  return (
    <>
      <PostWrapper>
        <div></div>
        {!gifModalIsOpen && (
          <div
            className="modal-box"
            style={{
              height: selectedPostImage || post?.gifUrl || post?.imgId || postData?.gifUrl || postData?.image ? '700px' : 'auto'
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
                          inputRef?.current?.focus();
                        }}
                        id="editable"
                        data-testid="editable"
                        name="post"
                        className={`editable flex-item ${textAreaBackground !== '#ffffff' ? 'textInputColor' : ''} ${postData.post.length === 0 && textAreaBackground !== '#ffffff' ? 'defaultInputTextColor' : ''}`}
                        contentEditable={true}
                        data-placeholder="What's on your mind?..."
                        onInput={(e) => {
                          const textContent = (e.currentTarget as HTMLDivElement).textContent || '';
                          const currentTextLength = textContent.length;
                          const counter = maxNumberOfCharacters - currentTextLength;
                          if (counterRef.current) {
                            counterRef.current.textContent = `${counter}/${maxNumberOfCharacters}`;
                          }
                          setAllowedNumberOfCharacters(`${counter}/${maxNumberOfCharacters}`);
                          setDisable(currentTextLength <= 0 && !postImage);
                          PostUtils.postInputEditable(textContent, postData, setPostData, setDisable);
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
                      imageInputRef?.current?.focus();
                    }}
                    data-testid="post-editable"
                    name="post"
                    className="post-input flex-item"
                    contentEditable={true}
                    data-placeholder="What's on your mind?..."
                    onInput={(e) => {
                      const textContent = (e.currentTarget as HTMLDivElement).textContent || '';
                      const currentTextLength = textContent.length;
                      const counter = maxNumberOfCharacters - currentTextLength;
                      if (counterRef.current) {
                        counterRef.current.textContent = `${counter}/${maxNumberOfCharacters}`;
                      }
                      setAllowedNumberOfCharacters(`${counter}/${maxNumberOfCharacters}`);
                      setDisable(currentTextLength <= 0 && !postImage);
                      PostUtils.postInputEditable(textContent, postData, setPostData, setDisable);
                    }}
                    onKeyDown={onKeyDown}
                  ></div>
                  <div className="image-display">
                    <div className="image-delete-btn" data-testid="image-delete-btn" onClick={() => clearImage()}>
                      <FaTimes />
                    </div>
                    <img data-testid="post-image" className="post-image" src={`${postImage}`} alt="" />
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
                      postData.bgColor = color;
                      setTextAreaBackground(color);
                      setPostData({ ...postData });
                      setDisable(false);
                    }}
                  ></li>
                ))}
              </ul>
            </div>
            <span className="char_count" data-testid="allowed-number" ref={counterRef}>
              {allowedNumberOfCharacters}
            </span>
            <ModalBoxSelection setSelectedPostImage={setSelectedPostImage} />
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

