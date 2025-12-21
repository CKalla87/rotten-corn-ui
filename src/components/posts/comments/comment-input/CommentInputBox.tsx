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

    // Store values before clearing for potential error recovery
    const savedComment = comment;
    const savedGifUrl = gifUrl;
    const savedShowGifPreview = showGifPreview;

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
      
      // Clear form immediately for better UX (optimistic UI update)
      
      setComment('');
      setGifUrl('');
      setShowGifPreview(false);
      setShowEmojiContainer(false);
      setShowGifContainer(false);
      
      // Optimistically update the post in Redux state
      dispatch(updatePostInList({
        ...updatedPost,
        commentsCount: String(newCommentsCount)
      }));
      
      // Send to API with timeout handling
      let response;
      try {
        response = await Promise.race([
          postService.addComment(commentBody),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout: Comment creation took too long')), 120000)
          )
        ]);
      } catch (timeoutError) {
        // Handle timeout specifically
        if ((timeoutError as Error)?.message?.includes('timeout')) {
          Utils.dispatchNotification('Comment creation timed out. The comment may still be posted. Please refresh to check.', 'error', dispatch);
          // Don't revert optimistic update - comment might have been saved
          return;
        }
        throw timeoutError; // Re-throw if it's not a timeout
      }
      
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
        // Preserve gifUrl from saved state if we have one, otherwise use from API response
        gifUrl: savedShowGifPreview && savedGifUrl ? savedGifUrl : (newComment?.gifUrl || undefined),
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
      
      // Form was already cleared above for immediate UX feedback
    } catch (error: unknown) {
      const axiosError = error as { 
        response?: { 
          status?: number;
          data?: { message?: string } 
        };
        message?: string;
        code?: string;
      };
      
      // Check for 503 Service Unavailable
      const is503 = axiosError?.response?.status === 503;
      const isTimeout = (error as Error)?.message?.includes('timeout') || 
                       axiosError?.code === 'ECONNABORTED';
      
      let errorMessage = 'An error occurred';
      if (is503) {
        errorMessage = 'Service temporarily unavailable. Please try again in a moment.';
      } else if (isTimeout) {
        errorMessage = 'Request timed out. The comment may still be posted. Please refresh to check.';
      } else {
        errorMessage = axiosError?.response?.data?.message || 'An error occurred';
      }
      
      Utils.dispatchNotification(errorMessage, 'error', dispatch);
      
      // Restore form values on error (except for timeout/503 where comment might have been saved)
      if (!isTimeout && !is503) {
        // Restore the comment input if there was an error
        setComment(savedComment);
        if (savedShowGifPreview && savedGifUrl) {
          setGifUrl(savedGifUrl);
          setShowGifPreview(true);
        }
        
        // Revert optimistic update
        dispatch(updatePostInList({
          ...post,
          commentsCount: post.commentsCount !== undefined ? String(post.commentsCount) : undefined
        }));
      }
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


