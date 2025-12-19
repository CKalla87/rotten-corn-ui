import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { cloneDeep } from 'lodash';
import { FaPaperPlane } from 'react-icons/fa';
import Input from '@components/input/Input';
import Button from '@components/button/Button';
import gif from '@assets/images/gif.png';
import feeling from '@assets/images/feeling.png';
import loadable from '@loadable/component';
import { GiphyContainer } from '@components/chat/giphy-container';
import { ImagePreview } from '@components/chat/image-preview';
import { postService } from '@services/api/post/post.service';
import { Utils } from '@services/utils/utils.service';
import { updatePostInList } from '@redux/reducers/posts/postsSlice';
import type { RootState, AppDispatch } from '@redux/store';
import './CommentInputBox.scss';

const EmojiPickerComponent = loadable(() => import('@components/chat/window/message-input/EmojiPicker'), {
  fallback: <p id="loading">Loading...</p>
});

interface PostData {
  _id?: string;
  userId?: string;
  commentsCount?: number;
  [key: string]: unknown;
}

interface CommentInputBoxProps {
  post: PostData;
  onCommentAdded?: (comment: CommentData) => void;
}

interface CommentData {
  _id?: string;
  username?: string;
  avatarColor?: string;
  profilePicture?: string;
  comment?: string;
  gifUrl?: string;
  [key: string]: unknown;
}

const CommentInputBox = ({ post, onCommentAdded }: CommentInputBoxProps) => {
  const { profile } = useSelector((state: RootState) => state.user);
  const [comment, setComment] = useState('');
  const [showEmojiContainer, setShowEmojiContainer] = useState(false);
  const [showGifContainer, setShowGifContainer] = useState(false);
  const [showGifPreview, setShowGifPreview] = useState(false);
  const [gifUrl, setGifUrl] = useState('');
  const commentInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const gifContainerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLDivElement>(null);
  const gifButtonRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<AppDispatch>();

  const submitComment = async (event?: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault();
    }
    
    // Don't send if there's nothing to send
    if (!comment.trim() && !showGifPreview) {
      return;
    }

    try {
      const updatedPost = cloneDeep(post);
      const newCommentsCount = (Number(updatedPost.commentsCount) || 0) + 1;
      updatedPost.commentsCount = newCommentsCount;
      
      // If there's a GIF, include it in the comment
      const commentText = showGifPreview && gifUrl 
        ? (comment.trim() || 'Sent a GIF') 
        : comment.trim();
      
      const commentBody = {
        userTo: post?.userId,
        postId: post?._id,
        comment: commentText,
        gifUrl: showGifPreview ? gifUrl : undefined,
        commentsCount: newCommentsCount,
        profilePicture: profile?.profilePicture
      };
      
      // Optimistically update the post in Redux state
      dispatch(updatePostInList({
        ...updatedPost,
        commentsCount: String(newCommentsCount)
      }));
      
      // Send to API first
      const response = await postService.addComment(commentBody);
      
      // Try different response structures to get the new comment
      const newComment = response?.data?.comment || 
                        response?.data?.data?.comment || 
                        response?.data?.data ||
                        response?.data;
      
      // Create comment object for immediate display
      // Ensure gifUrl is preserved - spread newComment first, then override with our values
      const commentData: CommentData = {
        ...newComment,
        _id: newComment?._id || newComment?.id || `temp-${Date.now()}`,
        username: profile?.username || '',
        avatarColor: profile?.avatarColor || '',
        profilePicture: profile?.profilePicture || '',
        comment: commentText,
        // Preserve gifUrl from our state if we have one, otherwise use from API response
        gifUrl: showGifPreview && gifUrl ? gifUrl : (newComment?.gifUrl || undefined),
        createdAt: newComment?.createdAt || new Date().toISOString(), // Use API createdAt if available, otherwise current time
        reactions: newComment?.reactions || {
          like: 0,
          love: 0,
          haha: 0,
          wow: 0,
          sad: 0,
          angry: 0
        },
        userReaction: newComment?.userReaction || '',
        reaction: newComment?.reaction || [] // Preserve reaction array from API if available
      };
      
      // Call the callback to add comment immediately (optimistic update)
      if (onCommentAdded) {
        onCommentAdded(commentData);
      }
      
      // Note: Backend will emit 'comment' socket event which the modal listens to
      // We don't need to emit here to avoid duplicates
      
      // Clear form
      setComment('');
      setGifUrl('');
      setShowGifPreview(false);
      setShowEmojiContainer(false);
      setShowGifContainer(false);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
      
      // Revert optimistic update on error
      dispatch(updatePostInList({
        ...post,
        commentsCount: post.commentsCount !== undefined ? String(post.commentsCount) : undefined
      }));
    }
  };

  const handleGiphyClick = (url: string) => {
    setGifUrl(url);
    setShowGifPreview(true);
    setShowGifContainer(false);
    setShowEmojiContainer(false);
  };

  // Close emoji and gif containers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside emoji picker (but not on the emoji button)
      if (
        showEmojiContainer &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(target) &&
        !emojiButtonRef.current?.contains(target)
      ) {
        setShowEmojiContainer(false);
      }
      
      // Check if click is outside gif container (but not on the gif button)
      if (
        showGifContainer &&
        gifContainerRef.current &&
        !gifContainerRef.current.contains(target) &&
        !gifButtonRef.current?.contains(target)
      ) {
        setShowGifContainer(false);
      }
    };

    if (showEmojiContainer || showGifContainer) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiContainer, showGifContainer]);

  useEffect(() => {
    if (commentInputRef?.current) {
      commentInputRef.current.focus();
    }
  }, []);

  return (
    <div className="comment-container" data-testid="comment-input">
      {showEmojiContainer && (
        <div className="emoji-picker-wrapper" ref={emojiPickerRef}>
          <EmojiPickerComponent
            onEmojiClick={(emojiObject: { emoji: string }) => {
              setComment((text) => (text += emojiObject.emoji));
            }}
            pickerStyle={{ width: '352px', height: '447px' }}
          />
        </div>
      )}
      {showGifContainer && (
        <div className="giphy-container-wrapper" ref={gifContainerRef}>
          <GiphyContainer handleGiphyClick={handleGiphyClick} />
        </div>
      )}
      {showGifPreview && (
        <ImagePreview
          image={gifUrl}
          onRemoveImage={() => {
            setGifUrl('');
            setShowGifPreview(false);
          }}
        />
      )}
      <form 
        className="comment-form" 
        onSubmit={(e) => {
          e.preventDefault();
          submitComment(e);
        }}
      >
        <div className="comment-input-wrapper">
          <div
            ref={gifButtonRef}
            className="comment-icon-button"
            onClick={() => {
              setShowGifContainer(!showGifContainer);
              setShowEmojiContainer(false);
            }}
          >
            <img src={gif} alt="GIF" />
          </div>
          <div
            ref={emojiButtonRef}
            className="comment-icon-button"
            onClick={() => {
              setShowEmojiContainer(!showEmojiContainer);
              setShowGifContainer(false);
            }}
          >
            <img src={feeling} alt="Emoji" />
          </div>
          <Input
            ref={commentInputRef}
            name="comment"
            type="text"
            value={comment}
            labelText=""
            className="comment-input"
            placeholder="Write a comment..."
            handleChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                if (comment.trim() || showGifPreview) {
                  submitComment(e as unknown as React.FormEvent<HTMLFormElement>);
                }
              }
            }}
          />
          <Button 
            label={<FaPaperPlane />} 
            className="comment-send-button" 
            handleClick={() => submitComment()}
            disabled={!comment.trim() && !showGifPreview}
          />
        </div>
      </form>
    </div>
  );
};

export default CommentInputBox;


