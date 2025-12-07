import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { find } from 'lodash';
import { FaPencilAlt, FaRegTrashAlt } from 'react-icons/fa';
import Avatar from '@components/avatar/Avatar';
import ImageModal from '@components/image-modal/ImageModal';
import Dialog from '@components/dialog/Dialog';
import PostCommentSection from '@components/posts/post-comment-section/PostCommentSection';
import ReactionsModal from '@components/posts/reactions/reactions-modal/ReactionsModal';
import CommentsModal from '@components/posts/comments/comments-modal/CommentsModal';
import CommentInputBox from '@components/posts/comments/comment-input/CommentInputBox';
import { postService } from '@services/api/post/post.service';
import { ImageUtils } from '@services/utils/image-utils.service';
import { Utils } from '@services/utils/utils.service';
import { timeAgo } from '@services/utils/timeago.utils';
import { feelingsList, privacyList } from '@services/utils/static.data';
import { openModal, toggleDeleteDialog } from '@redux/reducers/modal/modalSlice';
import { updatePostItem, clearPost } from '@redux/reducers/post/postSlice';
import { removePost } from '@redux/reducers/posts/postsSlice';
import useLocalStorage from '@hooks/useLocalStorage';
import type { FeelingItem, PrivacyItem } from '@services/utils/static.data';
import type { RootState, AppDispatch } from '@redux/store';
import './Post.scss';

interface PostData {
  username?: string;
  avatarColor?: string;
  profilePicture?: string;
  feelings?: string;
  privacy?: string;
  createdAt?: string;
  post?: string;
  bgColor?: string;
  gifUrl?: string;
  image?: string;
  imgId?: string;
  imgVersion?: string;
  videoId?: string;
  videoVersion?: string;
  reactions?: Array<{ type?: string; senderName?: string }>;
  commentsCount?: string | number;
  [key: string]: unknown;
}

interface PostProps {
  post: PostData;
  showIcons?: boolean;
}

const Post = ({ post, showIcons = false }: PostProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { reactionModalIsOpen, commentsModalIsOpen, deleteDialogIsOpen } = useSelector((state: RootState) => state.modal);
  const { post: postFromRedux } = useSelector((state: RootState) => state.post);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const selectedPostId = useLocalStorage<string>('selectedPostId', 'get');


  const getFeeling = (name?: string): string => {
    if (!name) return '';
    const feeling = find(feelingsList, (data: FeelingItem) => data.name === name);
    return feeling?.image || '';
  };

  const getPrivacy = (type?: string): React.ReactElement | null => {
    if (!type) return null;
    const privacy = find(privacyList, (data: PrivacyItem) => data.topText === type);
    return privacy?.icon || null;
  };

  const openPostModal = () => {
    dispatch(openModal({ type: 'edit', data: post }));
    dispatch(updatePostItem(post));
  };

  const openDeleteDialog = () => {
    dispatch(toggleDeleteDialog({ data: post, toggle: !deleteDialogIsOpen }));
    dispatch(updatePostItem(post));
  };

  const getBackgroundImageColor = useCallback(async (post: PostData) => {
    let imageUrl = '';
    if (post.imgId && !post.gifUrl) {
      imageUrl = Utils.getImage(post.imgId as string, post.imgVersion as string);
    } else if (post.gifUrl) {
      imageUrl = post.gifUrl;
    }
    if (imageUrl) {
      await ImageUtils.getBackgroundImageColor(imageUrl);
    }
  }, []);

  const deletePost = async () => {
    try {
      const postToDelete = postFromRedux?._id || post?._id;
      if (postToDelete) {
        // Remove post from Redux state immediately (optimistic update)
        dispatch(removePost(postToDelete));
        
        const response = await postService.deletePost(postToDelete as string);
        if (response) {
          Utils.dispatchNotification(response.data?.message || 'Post deleted successfully', 'success', dispatch);
        }
        dispatch(toggleDeleteDialog({ toggle: false }));
        dispatch(clearPost());
      }
    } catch (error: unknown) {
      // If deletion fails, we might want to re-add the post, but for now just show error
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred while deleting the post', 'error', dispatch);
    }
  };

  useEffect(() => {
    if ((post?.imgId && !post?.gifUrl) || post?.gifUrl) {
      getBackgroundImageColor(post);
    }
  }, [post, getBackgroundImageColor]);

  return (
    <>
      {reactionModalIsOpen && <ReactionsModal />}
      {commentsModalIsOpen && <CommentsModal />}
      {showImageModal && (
        <ImageModal
          image={imageUrl}
          onCancel={() => setShowImageModal(!showImageModal)}
          showArrow={false}
        />
      )}
      {deleteDialogIsOpen && (
        <Dialog
          title="Are you sure you want to delete this post?"
          firstButtonText="Delete"
          secondButtonText="Cancel"
          firstBtnHandler={() => deletePost()}
          secondBtnHandler={() => {
            dispatch(toggleDeleteDialog({ toggle: !deleteDialogIsOpen }));
            dispatch(clearPost());
          }}
        />
      )}
      <div className="post-body" data-testid="post">
      <div className="user-post-data">
        <div className="user-post-data-wrap">
          <div className="user-post-image">
            <Avatar
              name={post?.username}
              bgColor={post?.avatarColor}
              textColor="#ffffff"
              size={50}
              avatarSrc={post?.profilePicture}
            />
          </div>
          <div className="user-post-info">
            <div className="inline-title-display">
              <h5 data-testid="username">{post?.username}</h5>
              {post?.feelings && (
                <div className="inline-display" data-testid="inline-display">
                  is feeling <img className="feeling-icon" src={`${getFeeling(post?.feelings)}`} alt="" />{' '}
                  <div>{post?.feelings}</div>
                </div>
              )}
            </div>
            {showIcons && (
              <div className="post-icons" data-testid="post-icons">
                <FaPencilAlt className="pencil" onClick={openPostModal} />
                <FaRegTrashAlt className="trash" onClick={openDeleteDialog} />
              </div>
            )}
            {post?.createdAt && (
              <p className="time-text-display" data-testid="time-display">
                {timeAgo.transform(post.createdAt)} {getPrivacy(post?.privacy)}
              </p>
            )}
          </div>
        </div>
      </div>
      <hr />
      <div className="user-post" style={{ marginTop: '1rem', borderBottom: '' }}>
        {post?.post && post?.bgColor === '#ffffff' && <p>{post.post}</p>}
        {post?.post && post?.bgColor !== '#ffffff' && (
          <div className="user-post-with-bg" style={{ backgroundColor: `${post?.bgColor}` }}>
            {post.post}
          </div>
        )}
        {post?.gifUrl && (
          <div className="image-display-flex">
            <img className="post-image" src={Utils.fixCloudinaryUrl(post.gifUrl as string)} alt="" />
          </div>
        )}
        {post?.imgId && post?.imgVersion && !post?.gifUrl && (
          <div
            className="image-display-flex"
            data-testid="post-image"
            onClick={() => {
              const imageUrl = Utils.getImage(post.imgId as string, post.imgVersion as string);
              setImageUrl(imageUrl);
              setShowImageModal(!showImageModal);
            }}
          >
            <img 
              className="post-image" 
              src={Utils.getImage(post.imgId as string, post.imgVersion as string)} 
              alt="" 
              style={{ objectFit: 'contain' }}
              onError={() => {
                // 401 errors indicate images are not set to public in Cloudinary
                // Backend needs to upload with access_mode: 'public'
                console.error('Image failed to load. If you see 401, backend needs to set access_mode: "public" when uploading to Cloudinary.');
              }}
            />
          </div>
        )}
        {post?.image && !post?.imgId && !post?.gifUrl && (
          <div className="image-display-flex">
            <img 
              className="post-image" 
              src={Utils.fixCloudinaryUrl(post.image as string)} 
              alt=""
              onError={() => {
                console.error('Image failed to load with image field:', {
                  image: post.image,
                  fixedUrl: Utils.fixCloudinaryUrl(post.image as string),
                  post: post
                });
              }}
            />
          </div>
        )}
        {post?.videoId && (
          <div
            data-testid="post-video"
            className="image-display-flex"
            style={{ height: '600px', backgroundColor: '#000000' }}
            onClick={() => {
              setImageUrl(Utils.getVideo(post.videoId as string, post.videoVersion as string));
              setShowImageModal(!showImageModal);
            }}
          >
            <video width="100%" height="600px" controls src={`${Utils.getVideo(post.videoId as string, post.videoVersion as string)}`} />
          </div>
        )}
      </div>
      {(post?.reactions && post.reactions.length > 0) || (post?.commentsCount && Number(post.commentsCount) > 0) ? (
        <>
          <hr />
          <PostCommentSection post={post} />
        </>
      ) : null}
      {selectedPostId === post._id && <CommentInputBox post={post} />}
      </div>
    </>
  );
};

export default Post;

