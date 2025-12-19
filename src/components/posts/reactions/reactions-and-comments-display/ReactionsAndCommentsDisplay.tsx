import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { FaSpinner } from 'react-icons/fa';
import { postService } from '@services/api/post/post.service';
import { Utils } from '@services/utils/utils.service';
import { toggleReactionsModal, toggleCommentsModal } from '@redux/reducers/modal/modalSlice';
import { updatePostItem } from '@redux/reducers/post/postSlice';
import type { AppDispatch } from '@redux/store';
import './ReactionsAndCommentsDisplay.scss';

interface ReactionItem {
  type: string;
  value: number;
}

interface PostReaction {
  type?: string;
  senderName?: string;
  username?: string;
  postId?: string;
  _id?: string;
  [key: string]: unknown;
}

interface PostReactionsCount {
  like?: number;
  love?: number;
  happy?: number;
  sad?: number;
  wow?: number;
  angry?: number;
  [key: string]: number | undefined;
}

interface PostData {
  reactions?: PostReaction[] | PostReactionsCount;
  commentsCount?: string | number;
  _id?: string;
  [key: string]: unknown;
}

interface ReactionsAndCommentsDisplayProps {
  post: PostData;
}

const ReactionsAndCommentsDisplay = ({ post }: ReactionsAndCommentsDisplayProps) => {
  const [postReactions, setPostReactions] = useState<PostReaction[]>([]);
  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const [postCommentNames, setPostCommentNames] = useState<string[]>([]);
  const dispatch = useDispatch<AppDispatch>();

  const getPostReactions = useCallback(async () => {
    try {
      const response = await postService.getPostReactions(post?._id || '');
      setPostReactions(response.data.reactions);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  }, [post, dispatch]);

  const getPostCommentsNames = useCallback(async () => {
    try {
      const response = await postService.getPostCommentsNames(post?._id || '');
      setPostCommentNames([...new Set((response.data.comments.names as string[]) || [])]);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  }, [post, dispatch]);

  const sumAllReactions = (reactions: ReactionItem[]): string | number => {
    if (reactions?.length) {
      const result = reactions.map((item) => item.value).reduce((prev, next) => prev + next, 0);
      return Utils.shortenLargeNumbers(result);
    }
    return 0;
  };

  const openReactionsComponent = () => {
    const reactionsArray = Array.isArray(post.reactions) 
      ? post.reactions 
      : post.reactions 
        ? Object.entries(post.reactions as PostReactionsCount).map(([type, count]) => ({ type, value: count || 0 }))
        : [];
    dispatch(updatePostItem({
      ...post,
      commentsCount: post.commentsCount !== undefined ? String(post.commentsCount) : undefined,
      reactions: reactionsArray as Array<Record<string, unknown>>
    }));
    dispatch(toggleReactionsModal(true));
  };

  const openCommentsComponent = () => {
    const reactionsArray = Array.isArray(post.reactions) 
      ? post.reactions 
      : post.reactions 
        ? Object.entries(post.reactions as PostReactionsCount).map(([type, count]) => ({ type, value: count || 0 }))
        : [];
    
    const postId = post._id || (post as { id?: string })?.id;
    
    // Ensure all post data is included, especially _id
    const postData = {
      ...post,
      _id: postId,
      id: postId,
      commentsCount: post.commentsCount !== undefined ? String(post.commentsCount) : undefined,
      reactions: reactionsArray as Array<Record<string, unknown>>
    };
    
    console.log('📤 Setting post in Redux:', postData);
    console.log('📤 Post _id:', postId);
    
    dispatch(updatePostItem(postData));
    // Store post ID and full post data in modal for immediate access
    dispatch(toggleCommentsModal({ isOpen: true, postId: postId as string, post: postData }));
  };

  useEffect(() => {
    const reactionsCount = post?.reactions as PostReactionsCount || {};
    const normalizedReactions: Record<string, number> = {};
    Object.keys(reactionsCount).forEach((key) => {
      const value = reactionsCount[key];
      if (typeof value === 'number') {
        normalizedReactions[key] = value;
      }
    });
    const formattedReactions = Utils.formattedReactions(normalizedReactions);
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setReactions(formattedReactions);
      void getPostReactions();
    }, 0);
  }, [post, getPostReactions]);

  const reactionsCount = sumAllReactions(reactions);
  const reactionsCountNum = typeof reactionsCount === 'number' ? reactionsCount : Number(reactionsCount) || 0;

  return (
    <div className="reactions-display">
      <div className="reaction">
        <div className="likes-block">
          {reactionsCountNum > 0 && (
          <span
            data-testid="reactions-count"
            className="tooltip-container reactions-count"
            onMouseEnter={getPostReactions}
            onClick={openReactionsComponent}
            style={{ cursor: 'pointer' }}
          >
            {reactionsCount}
            <div className="tooltip-container-text tooltip-container-likes-bottom" data-testid="tooltip-container">
              <div className="likes-block-icons-list">
                {postReactions.length === 0 && <FaSpinner className="circle-notch" />}
                {postReactions.length > 0 && (
                  <>
                    {postReactions.map((reaction) => (
                      <span key={Utils.generateString(10)}>{reaction?.username}</span>
                    ))}
                    {postReactions.length > 20 && (
                      <span>and {postReactions.length - 20} others...</span>
                    )}
                  </>
                )}
              </div>
            </div>
          </span>
          )}
        </div>
      </div>
      <div className="comment tooltip-container" data-testid="comment-container">
        {post?.commentsCount && Number(post.commentsCount) > 0 && (
          <span onMouseEnter={getPostCommentsNames} onClick={openCommentsComponent} data-testid="comment-count" style={{ cursor: 'pointer' }}>
            {Utils.shortenLargeNumbers(Number(post.commentsCount))} {`${Number(post.commentsCount) === 1 ? 'Comment' : 'Comments'}`}
          </span>
        )}
        <div className="tooltip-container-text tooltip-container-comments-bottom" data-testid="comment-tooltip">
          <div className="likes-block-icons-list">
            {postCommentNames.length === 0 && <FaSpinner className="circle-notch" />}
            {postCommentNames.length > 0 && (
              <>
                {postCommentNames.slice(0, 19).map((names) => (
                  <span key={Utils.generateString(10)}>{names}</span>
                ))}
                {postCommentNames.length > 20 && (
                  <span>and {postCommentNames.length - 20} others...</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReactionsAndCommentsDisplay;

