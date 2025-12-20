import { useState, useEffect, useRef, useMemo, useCallback, memo, startTransition, useLayoutEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { find, cloneDeep } from 'lodash';
import ReactionWrapper from '@components/posts/modal-wrappers/reaction-wrapper/ReactionWrapper';
import Avatar from '@components/avatar/Avatar';
import CommentInputBox from '@components/posts/comments/comment-input/CommentInputBox';
import Reactions from '@components/posts/reactions/Reactions';
import { postService } from '@services/api/post/post.service';
import { socketService } from '@services/socket/socket.service';
import { Utils } from '@services/utils/utils.service';
import { ProfileUtils } from '@services/utils/profile-utils.service';
import { timeAgo } from '@services/utils/timeago.utils';
import { privacyList, reactionsMap } from '@services/utils/static.data';
import { closeModal, toggleCommentsModal } from '@redux/reducers/modal/modalSlice';
import { clearPost } from '@redux/reducers/post/postSlice';
import type { PrivacyItem } from '@services/utils/static.data';
import type { RootState, AppDispatch } from '@redux/store';
import './CommentsModal.scss';

interface CommentReaction {
  senderName?: string;
  username?: string;
  type?: string;
  [key: string]: unknown;
}

interface CommentData {
  _id?: string;
  username?: string;
  avatarColor?: string;
  profilePicture?: string;
  comment?: string;
  gifUrl?: string;
  createdAt?: string | Date;
  reaction?: CommentReaction[]; // Array of reactions like chat messages
  reactions?: CommentReaction[] | Record<string, number>; // Support both formats
  userReaction?: string; // For backward compatibility
  [key: string]: unknown;
}

interface PostData {
  _id?: string;
  id?: string;
  username?: string;
  userId?: string;
  uId?: string;
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
  [key: string]: unknown;
}

interface CommentListItemProps {
  commentId: string;
  commentData: CommentData;
  userReaction: string;
  totalReactions: number;
  gifUrl: string | null;
  showReactionsForComment: string | null;
  toggleReactionsForComment: (commentId: string, e: React.MouseEvent) => void;
  addCommentReaction: (commentId: string, reaction: string) => void;
  reactionsRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  commentRefs: React.MutableRefObject<Record<string, HTMLLIElement | null>>;
  reactionsMap: Record<string, string>;
}

// Memoized comment list item to prevent unnecessary re-renders when scrolling
// Custom comparison function to only re-render when necessary props change
const CommentListItem = memo(({
  commentId,
  commentData,
  userReaction,
  totalReactions,
  gifUrl,
  showReactionsForComment,
  toggleReactionsForComment,
  addCommentReaction,
  reactionsRefs,
  commentRefs,
  reactionsMap
}: CommentListItemProps) => {
  const [gifLoaded, setGifLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  
  // Memoize ref callbacks to prevent recreation on every render
  // This prevents re-renders during scroll
  const commentRefCallback = useCallback((el: HTMLLIElement | null) => {
    if (commentId && el) {
      // eslint-disable-next-line react-hooks/immutability
      commentRefs.current[commentId] = el;
    } else if (commentId && !el) {
      // Clean up ref when element is removed
      delete commentRefs.current[commentId];
    }
  }, [commentId, commentRefs]);
  
  const reactionsRefCallback = useCallback((el: HTMLDivElement | null) => {
    if (commentId && el) {
      // eslint-disable-next-line react-hooks/immutability
      reactionsRefs.current[commentId] = el;
    } else if (commentId && !el) {
      // Clean up ref when element is removed
      delete reactionsRefs.current[commentId];
    }
  }, [commentId, reactionsRefs]);

  return (
    <li 
      className="modal-comments-container-list-item" 
      key={commentId} 
      data-testid="modal-list-item"
      ref={commentRefCallback}
      style={{
        display: 'block',
        visibility: 'visible',
        opacity: 1,
        minHeight: '60px',
        color: 'var(--black-1)'
      }}
    >
      <div className="modal-comments-container-list-item-display">
        <div className="user-img">
          <Avatar
            name={commentData?.username}
            bgColor={commentData?.avatarColor}
            textColor="#ffffff"
            size={50}
            avatarSrc={commentData?.profilePicture}
          />
        </div>
        <div className="modal-comments-container-list-item-display-block" style={{ minWidth: 0, overflow: 'visible' }}>
          <div className="comment-data" style={{ width: '100%', maxWidth: '100%', overflow: 'visible' }}>
            <h1 style={{ 
              color: 'var(--black-1)', 
              display: 'block',
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '8px',
              opacity: 1
            }}>{commentData?.username || 'Unknown'}</h1>
            <p style={{ 
              color: 'var(--black-2)', 
              display: 'block',
              fontSize: '15px',
              lineHeight: '1.6',
              opacity: 1,
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              whiteSpace: 'normal',
              overflow: 'visible',
              maxWidth: '100%'
            }}>{commentData?.comment || ''}</p>
            {gifUrl && (
              <div className="comment-gif-container" style={{ minHeight: gifLoaded ? 'auto' : '150px' }}>
                <img 
                  ref={imgRef}
                  src={gifUrl} 
                  alt="GIF" 
                  loading="lazy"
                  decoding="async"
                  style={{ 
                    maxWidth: '200px', 
                    marginTop: '8px', 
                    borderRadius: '8px',
                    display: gifLoaded ? 'block' : 'none',
                    aspectRatio: 'auto',
                    width: 'auto',
                    height: 'auto',
                    opacity: gifLoaded ? 1 : 0,
                    transition: 'opacity 0.3s ease-in-out'
                  }}
                  onLoad={(e) => {
                    setGifLoaded(true);
                    const target = e.target as HTMLImageElement;
                    target.style.opacity = '1';
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                {!gifLoaded && (
                  <div style={{
                    width: '200px',
                    height: '150px',
                    marginTop: '8px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--white-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--gray-7)',
                    fontSize: '12px'
                  }}>
                    Loading GIF...
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="comment-reactions-section">
            <div className="comment-reactions-wrapper" ref={reactionsRefCallback}>
              <div 
                className={`comment-reaction-button ${userReaction ? String(userReaction).toLowerCase() : ''}`}
                onClick={(e) => toggleReactionsForComment(commentId, e)}
              >
                {userReaction ? (
                  <img 
                    className="reaction-img" 
                    src={reactionsMap[userReaction] || reactionsMap.like} 
                    alt={userReaction} 
                    onError={(e) => {
                      // Fallback if image fails to load - try like icon
                      const target = e.target as HTMLImageElement;
                      if (target.src !== reactionsMap.like && reactionsMap.like) {
                        target.src = reactionsMap.like;
                      }
                    }}
                  />
                ) : (
                  <span className="reaction-text">Like</span>
                )}
              </div>
              {showReactionsForComment === commentId && (
                <div className="comment-reactions-picker">
                  <Reactions handleClick={(reaction) => addCommentReaction(commentId, reaction)} showLabel={false} />
                </div>
              )}
              {totalReactions > 0 && (
                <span className="comment-reactions-count">{totalReactions}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if relevant props changed
  // Refs (reactionsRefs, commentRefs) and reactionsMap are excluded as they don't change
  // Compare commentData fields that actually matter for rendering
  const commentDataChanged = 
    prevProps.commentData?._id !== nextProps.commentData?._id ||
    prevProps.commentData?.comment !== nextProps.commentData?.comment ||
    prevProps.commentData?.username !== nextProps.commentData?.username ||
    prevProps.commentData?.profilePicture !== nextProps.commentData?.profilePicture ||
    prevProps.commentData?.avatarColor !== nextProps.commentData?.avatarColor ||
    prevProps.commentData?.gifUrl !== nextProps.commentData?.gifUrl ||
    prevProps.commentData?.reaction !== nextProps.commentData?.reaction ||
    prevProps.commentData?.reactions !== nextProps.commentData?.reactions ||
    prevProps.commentData?.userReaction !== nextProps.commentData?.userReaction;
  
  // Only re-render if:
  // 1. Comment data actually changed, OR
  // 2. This specific comment's reaction picker should show/hide, OR
  // 3. User reaction or total reactions changed for THIS comment
  const shouldShowReactionsChanged = 
    (prevProps.showReactionsForComment === prevProps.commentId) !== 
    (nextProps.showReactionsForComment === nextProps.commentId);
  
  const reactionDataChanged = 
    prevProps.userReaction !== nextProps.userReaction ||
    prevProps.totalReactions !== nextProps.totalReactions;
  
  // Return true if props are equal (skip re-render), false if different (re-render)
  // Very strict comparison - only re-render if absolutely necessary
  // Refs are excluded from comparison as they don't affect rendering
  return (
    prevProps.commentId === nextProps.commentId &&
    !commentDataChanged &&
    !shouldShowReactionsChanged &&
    !reactionDataChanged &&
    prevProps.gifUrl === nextProps.gifUrl &&
    prevProps.toggleReactionsForComment === nextProps.toggleReactionsForComment &&
    prevProps.addCommentReaction === nextProps.addCommentReaction &&
    // Ensure refs don't cause re-renders (they're stable references)
    prevProps.commentRefs === nextProps.commentRefs &&
    prevProps.reactionsRefs === nextProps.reactionsRefs &&
    prevProps.reactionsMap === nextProps.reactionsMap
  );
});

CommentListItem.displayName = 'CommentListItem';

const CommentsModal = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  // CRITICAL: Declare isScrollingRef early so it can be used in selectors
  const isScrollingRef = useRef<boolean>(false); // Track if user is currently scrolling
  
  // Use shallow equality checks to prevent unnecessary re-renders
  // CRITICAL: Use stable selectors that only change when necessary
  // During scroll, we want to ignore Redux updates that don't affect the comments modal
  const { commentsModalIsOpen, data } = useSelector((state: RootState) => state.modal, (left, right) => {
    // Only re-render if modal open state or data actually changed
    return left.commentsModalIsOpen === right.commentsModalIsOpen && left.data === right.data;
  });
  
  // CRITICAL FIX: Remove Redux subscriptions that cause unnecessary re-renders
  // The modal already receives post data via `data.post`, so we don't need Redux subscriptions
  // This prevents re-renders when Redux state changes elsewhere (posts feed, reactions, etc.)
  // Only subscribe to Redux if we truly don't have post data from modal
  const modalData = useMemo(() => {
    return data as { postId?: string; post?: PostData } | null;
  }, [data]);
  
  const hasPostFromModal = !!(modalData?.post);
  
  // Cache for allPosts post to prevent re-renders when array reference changes
  // Declare before selector so it can be used inside
  const allPostsPostCacheRef = useRef<{ post: PostData | null; postId: string | undefined; postObjectId: string | undefined }>({
    post: null,
    postId: undefined,
    postObjectId: undefined
  });
  
  // Only subscribe to Redux post state if we don't have post from modal
  // Use a stable selector that only changes when the actual post object reference changes
  const { post: postFromRedux } = useSelector((state: RootState) => {
    // If we have post from modal, return null to prevent unnecessary subscriptions
    if (hasPostFromModal) return { post: null };
    return state.post;
  }, (left, right) => {
    // Only re-render if post actually changed (reference equality)
    const isEqual = left.post === right.post;
    return isEqual;
  });
  
  // CRITICAL: Use a ref to cache the post from allPosts to prevent re-renders
  // The allPosts.posts array gets a new reference every time ANY post updates,
  // but we only care about our specific post. Cache it and only update when the post itself changes.
  const allPostsPost = useSelector((state: RootState) => {
    // If we have post from modal or redux, don't need allPosts - return stable null
    if (hasPostFromModal || postFromRedux) {
      if (allPostsPostCacheRef.current.post !== null) {
        allPostsPostCacheRef.current = { post: null, postId: undefined, postObjectId: undefined };
      }
      return null;
    }
    
    // Get postId from modal
    const postId = modalData?.postId;
    if (!postId) {
      if (allPostsPostCacheRef.current.post !== null) {
        allPostsPostCacheRef.current = { post: null, postId: undefined, postObjectId: undefined };
      }
      return null; // No postId, can't find post
    }
    
    // If we're looking for a different post, clear cache
    if (allPostsPostCacheRef.current.postId !== postId) {
      allPostsPostCacheRef.current = { post: null, postId: postId, postObjectId: undefined };
    }
    
    const posts = state.allPosts.posts;
    if (!posts || !Array.isArray(posts)) {
      return allPostsPostCacheRef.current.post; // Return cached value
    }
    
    // Find the specific post we need
    const foundPost = (posts as unknown as PostData[]).find(
      (p: PostData) => p._id === postId || p.id === postId
    );
    
    if (!foundPost) {
      // Post not found - clear cache if it was set
      if (allPostsPostCacheRef.current.post !== null) {
        allPostsPostCacheRef.current = { post: null, postId: postId, postObjectId: undefined };
      }
      return null;
    }
    
    // Get the post's object ID for comparison
    const foundPostObjectId = foundPost._id || foundPost.id;
    
    // If we have a cached post, check if it's the same post object
    if (allPostsPostCacheRef.current.post && allPostsPostCacheRef.current.postObjectId === foundPostObjectId) {
      // Same post - check if critical fields changed
      const cachedPost = allPostsPostCacheRef.current.post;
      const criticalFieldsChanged = 
        cachedPost.post !== foundPost.post ||
        cachedPost.username !== foundPost.username ||
        cachedPost.userId !== foundPost.userId;
      
      if (criticalFieldsChanged) {
        // Critical fields changed - update cache
        allPostsPostCacheRef.current = {
          post: foundPost,
          postId: postId,
          postObjectId: foundPostObjectId
        };
        return foundPost;
      } else {
        // No critical changes - return cached version to prevent re-render
        return allPostsPostCacheRef.current.post;
      }
    } else {
      // New post or no cache - update cache
      allPostsPostCacheRef.current = {
        post: foundPost,
        postId: postId,
        postObjectId: foundPostObjectId
      };
      return foundPost;
    }
  }, (left, right) => {
    // CRITICAL: Use reference equality - if same object reference, no re-render
    // This prevents re-renders when the array reference changes but the post object is the same
    return left === right;
  });
  
  const { profile } = useSelector((state: RootState) => state.user, (left, right) => {
    return left.profile === right.profile;
  });
  const [postCommentsInternal, setPostCommentsInternal] = useState<CommentData[]>([]);
  const [postData, setPostData] = useState<PostData | null>(null);
  const [showReactionsForComment, setShowReactionsForComment] = useState<string | null>(null);
  const reactionsRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const commentRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const commentsContainerRef = useRef<HTMLDivElement | null>(null);
  const commentsListRef = useRef<HTMLUListElement | null>(null); // Ref for the actual list element
  const lastAddedCommentId = useRef<string | null>(null);
  const savingReactionsRef = useRef<Set<string>>(new Set()); // Track comments currently saving reactions
  const lastLoadedPostIdRef = useRef<string | undefined>(undefined); // Track last postId we loaded comments for
  const postCommentsRef = useRef<CommentData[]>([]); // Ref to access latest postComments without causing re-renders
  // isScrollingRef is declared earlier, before selectors
  const isLoadingCommentsRef = useRef<boolean>(false); // Guard to prevent duplicate API calls
  const currentFetchingPostIdRef = useRef<string | undefined>(undefined); // Track which postId is currently being fetched
  const fetchTokenRef = useRef<number>(0); // Unique token for each fetch attempt to ignore stale results
  
  // Wrapper for setPostComments to BLOCK updates during scroll
  // CRITICAL: During scrolling, we should NEVER update state - only update refs
  // This ensures zero re-renders during active scrolling
  const setPostComments = useCallback((updater: CommentData[] | ((prev: CommentData[]) => CommentData[])) => {
    // If scrolling, defer ALL updates until scroll ends
    if (isScrollingRef.current) {
      // Queue the update for after scrolling ends
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                       (window.innerWidth <= 768);
      const scrollDebounceDelay = isMobile ? 500 : 300;
      
      const checkAndApply = () => {
        if (!isScrollingRef.current) {
          // Scroll has ended, apply the update
          setPostCommentsInternal(updater);
        } else {
          // Still scrolling, check again
          setTimeout(checkAndApply, 100);
        }
      };
      setTimeout(checkAndApply, scrollDebounceDelay);
      return;
    }
    
    // Not scrolling - apply update immediately
    setPostCommentsInternal(updater);
  }, []);
  
  // Alias for consistency
  const postComments = postCommentsInternal;
  
  // Memoize image/video URLs to prevent recalculation on every render during scrolling
  // This prevents repeated calls to getCloudName() and getBaseUrl() during scroll
  const postImageUrl = useMemo(() => {
    if (!postData?.imgId || !postData?.imgVersion || postData?.gifUrl) {
      return null;
    }
    let imgSrc = Utils.getImage(
      postData.imgId as string,
      postData.imgVersion as string,
      postData.image as string
    );
    if (imgSrc) {
      imgSrc = Utils.fixCloudinaryUrl(imgSrc);
    }
    return imgSrc;
  }, [postData?.imgId, postData?.imgVersion, postData?.gifUrl, postData?.image]);
  
  const postVideoUrl = useMemo(() => {
    if (!postData?.videoId || !postData?.videoVersion) {
      return null;
    }
    return Utils.getVideo(postData.videoId as string, postData.videoVersion as string);
  }, [postData?.videoId, postData?.videoVersion]);
  
  const postGifUrl = useMemo(() => {
    if (!postData?.gifUrl) {
      return null;
    }
    return Utils.fixCloudinaryUrl(postData.gifUrl as string);
  }, [postData?.gifUrl]);
  
  const postFallbackImageUrl = useMemo(() => {
    if (!postData?.image || postData?.imgId || postData?.gifUrl) {
      return null;
    }
    return Utils.fixCloudinaryUrl(postData.image as string);
  }, [postData?.image, postData?.imgId, postData?.gifUrl]);
  
  // modalData is already declared earlier, before Redux selectors
  const postIdFromModal = useMemo(() => {
    return modalData?.postId;
  }, [modalData]);
  const postIdFromRedux = useMemo(() => {
    const post = postFromRedux as unknown as PostData;
    return post?._id || (postFromRedux as { id?: string })?.id;
  }, [postFromRedux]);
  const postId = useMemo(() => {
    return postIdFromModal || postIdFromRedux || undefined;
  }, [postIdFromModal, postIdFromRedux]);
  
  // Memoize current post lookup to prevent recalculation on every render
  const currentPost = useMemo(() => {
    let post: PostData | null = (modalData?.post as PostData) || (postFromRedux as unknown as PostData | null) || null;
  
  // If we have postId but no post data, use the selective post from allPosts
    if (!post && allPostsPost) {
      post = allPostsPost;
    }
    
    return post;
  }, [modalData, postFromRedux, allPostsPost]);

  // Memoize getPrivacy to prevent recreation on every render
  const getPrivacy = useCallback((type?: string): React.ReactElement | null => {
    if (!type) return null;
    const privacy = find(privacyList, (data: PrivacyItem) => data.topText === type);
    return privacy?.icon || null;
  }, []);

  // Extract comment processing logic to reuse for deferred updates
  const processCommentsResponse = useCallback((response: { data?: unknown }) => {
    try {
      // Handle different possible response structures
      let comments: CommentData[] = [];
      const responseData = (response as { data?: unknown }).data;
      
      // Removed console.log to prevent re-renders during scroll
      
      // Try response.data.comments first (most common)
      if (responseData && typeof responseData === 'object' && 'comments' in responseData) {
        const commentsField = (responseData as { comments?: unknown }).comments;
        if (Array.isArray(commentsField)) {
          comments = commentsField as CommentData[];
        } else if (commentsField && typeof commentsField === 'object' && 'data' in commentsField) {
          // Handle nested structure like { comments: { data: [...] } }
          const nestedComments = (commentsField as { data?: unknown }).data;
          if (Array.isArray(nestedComments)) {
            comments = nestedComments as CommentData[];
          }
        }
      }
      // Try response.data.data.comments
      if (comments.length === 0 && responseData && typeof responseData === 'object' && 'data' in responseData) {
        const nestedData = (responseData as { data?: unknown }).data;
        if (nestedData && typeof nestedData === 'object' && 'data' in nestedData) {
          // Try response.data.data.data.comments (triple nested)
          const tripleNested = (nestedData as { data?: unknown }).data;
          if (tripleNested && typeof tripleNested === 'object' && 'comments' in tripleNested) {
            const tripleComments = (tripleNested as { comments?: unknown }).comments;
            if (Array.isArray(tripleComments)) {
              comments = tripleComments as CommentData[];
            }
          }
        }
        if (comments.length === 0 && nestedData && typeof nestedData === 'object' && 'comments' in nestedData) {
          const nestedComments = (nestedData as { comments?: unknown }).comments;
          if (Array.isArray(nestedComments)) {
            comments = nestedComments as CommentData[];
          }
        }
        if (comments.length === 0 && Array.isArray(nestedData)) {
          comments = nestedData as CommentData[];
        }
      }
      // Try if response.data is directly an array
      if (comments.length === 0 && Array.isArray(responseData)) {
        comments = responseData as CommentData[];
        // Found comments in response.data (direct array)
      }
      // Try response directly (if axios response structure is different)
      if (comments.length === 0 && response && typeof response === 'object' && 'comments' in response) {
        const directComments = (response as { comments?: unknown }).comments;
        if (Array.isArray(directComments)) {
          comments = directComments as CommentData[];
          // Found comments in response.comments
        }
      }
      // Last resort: try to use response.data if it exists
      if (comments.length === 0 && responseData) {
        comments = Array.isArray(responseData) ? (responseData as CommentData[]) : [];
        // Using response.data as array (last resort)
      }
      if (comments.length === 0) {
        console.warn('⚠️ No comments found in response structure. Full response:', JSON.stringify(response, null, 2));
      }
      
      // Process comments - reactions and gifUrl should now be included in API response from backend
      // Backend returns comments sorted by createdAt: 1 (oldest first, newest last)
      const processedComments = comments.map((comment) => {
        // Processing comment (removed logging to prevent re-renders)
        
        // Ensure reaction is an array (from backend)
        const reactionArray: CommentReaction[] = Array.isArray(comment.reaction) 
          ? comment.reaction 
          : [];
        
        // Preserve gifUrl if it exists
        const gifUrl = comment.gifUrl && typeof comment.gifUrl === 'string' ? comment.gifUrl : undefined;
        
        // Ensure comment text exists - check multiple possible field names
        const commentText = comment.comment || comment.text || comment.message || '';
        
        // Derive userReaction from reaction array if not provided
        let userReaction = comment.userReaction;
        // Normalize userReaction to lowercase string if it exists
        if (userReaction && typeof userReaction === 'string') {
          userReaction = userReaction.toLowerCase().trim();
        } else {
          userReaction = '';
        }
        
        // If userReaction is not set, try to derive it from reaction array
        if (!userReaction && Array.isArray(reactionArray) && reactionArray.length > 0 && profile?.username) {
          const userReactionObj = reactionArray.find(
            (r: CommentReaction) => r.username === profile.username || r.senderName === profile.username
          );
          if (userReactionObj?.type) {
            userReaction = String(userReactionObj.type).toLowerCase().trim();
          }
        }
        
        const processedComment: CommentData = {
          ...comment,
          comment: commentText, // Ensure comment field is set as string
          reaction: reactionArray,
          gifUrl: gifUrl,
          userReaction: userReaction // Ensure userReaction is set for icon display (normalized to lowercase)
        } as CommentData;
        
        // Processed comment
        
        return processedComment;
      });
      
      // Ensure comments are sorted by createdAt (oldest first, newest at bottom)
      // Sort in ascending order to maintain chronological order
      processedComments.sort((a, b) => {
        const aTime = a.createdAt && (typeof a.createdAt === 'string' || a.createdAt instanceof Date) 
          ? new Date(a.createdAt).getTime() 
          : 0;
        const bTime = b.createdAt && (typeof b.createdAt === 'string' || b.createdAt instanceof Date)
          ? new Date(b.createdAt).getTime() 
          : 0;
        return aTime - bTime;
      });
      
      // Processed comments count
      
      // CRITICAL: Set comments immediately for initial load (no deferral)
      // Only defer socket/optimistic updates during scroll, not the initial API response
      setPostComments(processedComments);
    } catch (error: unknown) {
      console.error('❌ Error processing comments response:', error);
      const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
      const errorMessage = axiosError?.response?.data?.message || 'Failed to load comments';
      // Only show notification if it's not a 404 (comments not found is okay)
      if (axiosError?.response?.status !== 404) {
        Utils.dispatchNotification(errorMessage, 'error', dispatch);
      }
      setPostComments([]);
    }
  }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const getPostComments = useCallback(async (postIdToFetch?: string) => {
    try {
      // Use provided postId or fall back to state postId
      const currentPostId = postIdToFetch || postId;
      // Fetching comments for postId
      if (!currentPostId) {
        console.warn('⚠️ No postId available, cannot fetch comments');
        setPostComments([]);
        return;
      }
      const response = await postService.getPostComments(currentPostId);
      // Comments API response (removed detailed logging to prevent re-renders)
      
      // If user is scrolling, defer the state update until scroll ends
      if (isScrollingRef.current) {
        // Store the response and apply it after scroll ends
        const applyUpdate = () => {
          if (!isScrollingRef.current) {
            // Apply the update now that scrolling has stopped (use startTransition for smooth UI)
            startTransition(() => {
              processCommentsResponse(response);
            });
          } else {
            // Still scrolling, check again in 100ms
            setTimeout(applyUpdate, 100);
          }
        };
        setTimeout(applyUpdate, 100);
        return;
      }
      
      // Process and apply comments immediately if not scrolling (use startTransition for smooth UI)
      startTransition(() => {
        processCommentsResponse(response);
      });
    } catch (error) {
      console.error('❌ Error fetching post comments:', error);
      const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
      if (axiosError?.response?.status !== 404) {
        Utils.dispatchNotification(axiosError?.response?.data?.message || 'Failed to load comments', 'error', dispatch);
      }
      setPostComments([]);
    }
  }, [postId, processCommentsResponse, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const closeCommentsModal = () => {
    dispatch(closeModal());
    dispatch(clearPost());
    dispatch(toggleCommentsModal(false));
    setPostComments([]);
  };

  const getTotalReactionsCount = (reactions?: CommentReaction[] | Record<string, number>): number => {
    if (!reactions) return 0;
    // If it's an array (like chat messages), return length
    if (Array.isArray(reactions)) {
      return reactions.length;
    }
    // If it's an object with counts, sum them up
    if (typeof reactions === 'object') {
      return Object.values(reactions).reduce((sum: number, count) => sum + (typeof count === 'number' ? count : 0), 0);
    }
    return 0;
  };

  const getUserReaction = useCallback((comment: CommentData): string => {
    let reactionType = '';
    
    // First check userReaction field (backward compatibility)
    if (comment.userReaction && typeof comment.userReaction === 'string') {
      reactionType = comment.userReaction;
    }
    // Check reaction array (like chat messages) - find user's reaction
    else if (comment.reaction && Array.isArray(comment.reaction) && profile?.username) {
      const userReaction = comment.reaction.find(
        (r: CommentReaction) => r.senderName === profile.username || r.username === profile.username
      );
      if (userReaction?.type) {
        reactionType = userReaction.type;
      }
    }
    // Check reactions array (alternative field name)
    else if (comment.reactions && Array.isArray(comment.reactions) && profile?.username) {
      const userReaction = comment.reactions.find(
        (r: CommentReaction) => r.senderName === profile.username || r.username === profile.username
      );
      if (userReaction?.type) {
        reactionType = userReaction.type;
      }
    }
    
    // Normalize to lowercase and trim to match reactionsMap keys
    return reactionType ? reactionType.toLowerCase().trim() : '';
  }, [profile?.username]);
  

  const addCommentReaction = useCallback(async (commentId: string, reaction: string) => {
    if (!commentId || !postId) {
      console.error('❌ Missing commentId or postId');
      return;
    }
    
    // Prevent multiple simultaneous saves for the same comment
    if (savingReactionsRef.current.has(commentId)) {
      console.log('⚠️ Reaction save already in progress for comment:', commentId);
      return;
    }
    
    // Get the current comment and user reaction before updating
    // Use ref to get latest comments without causing re-renders
    const currentComments = postCommentsRef.current;
    const commentBeforeUpdate = currentComments.find((c) => c._id === commentId);
    if (!commentBeforeUpdate) {
      console.error('❌ Comment not found:', commentId);
      return;
    }
    
    // Create a deep copy to restore if API fails
    const originalComment = cloneDeep(commentBeforeUpdate);
    
    try {
      // Mark this comment as currently saving
      savingReactionsRef.current.add(commentId);
      
      setShowReactionsForComment(null);
      
      // Normalize reaction type to lowercase for consistent comparison
      const normalizedReaction = reaction.toLowerCase().trim();
      const currentUserReaction = getUserReaction(commentBeforeUpdate);
      const isRemoving = currentUserReaction === normalizedReaction;
      
      // Apply optimistic update immediately (no deferral during scroll for reactions)
      // Use setPostCommentsInternal directly to bypass scroll check for reactions
      const updateComment = (comment: CommentData): CommentData => {
        if (comment._id !== commentId) return comment;
        
        const updatedComment = cloneDeep(comment);
        const currentReactions = (updatedComment.reaction as CommentReaction[]) || [];
        
        if (isRemoving) {
          // Remove user's reaction
          updatedComment.reaction = currentReactions.filter(
            (r: CommentReaction) => !(r.senderName === profile?.username || r.username === profile?.username)
          );
          updatedComment.userReaction = ''; // Clear for backward compatibility
        } else {
          // Check if user already has ANY reaction (not just the same type)
          const existingReactionIndex = currentReactions.findIndex(
            (r: CommentReaction) => r.senderName === profile?.username || r.username === profile?.username
          );
          
          const newReaction: CommentReaction = {
            senderName: profile?.username || '',
            username: profile?.username || '',
            type: normalizedReaction
          };
          
          if (existingReactionIndex > -1) {
            // User already has a reaction - replace it with the new one (like chat)
            const updatedReactions = [...currentReactions];
            updatedReactions[existingReactionIndex] = newReaction;
            updatedComment.reaction = updatedReactions;
          } else {
            // User doesn't have a reaction yet - add the new one
            updatedComment.reaction = [...currentReactions, newReaction];
          }
          updatedComment.userReaction = normalizedReaction; // For backward compatibility
        }
        
        return updatedComment;
      };
      
      // Update state immediately (bypassing scroll check)
      setPostCommentsInternal((prevComments) => prevComments.map(updateComment));
      
      // Update ref immediately to keep it in sync
      postCommentsRef.current = postCommentsRef.current.map(updateComment);
      
      // Call API to save reaction using the post reaction endpoint with commentId
      try {
        if (isRemoving) {
          // Remove reaction - use DELETE endpoint with commentId in body
          console.log('💾 Removing comment reaction:', { commentId, previousReaction: currentUserReaction });
          
          const removeResponse = await Promise.race([
            postService.removeReaction(postId, currentUserReaction, {}, commentId),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout: Reaction removal took too long')), 120000)
            )
          ]);
          
          if (!removeResponse || !removeResponse.data) {
            throw new Error('Invalid API response');
          }
          
          console.log('✅ Comment reaction removed:', removeResponse.data);
          
          // Update comment state with API response if it contains updated comment data
          // Use setPostCommentsInternal directly to bypass scroll check for reactions
          if (removeResponse.data?.comment) {
            setPostCommentsInternal((prevComments) => prevComments.map((comment) => {
              if (comment._id === commentId) {
                const updatedComment = { ...comment };
                // Update reaction array from API response
                if (removeResponse.data.comment.reaction) {
                  updatedComment.reaction = Array.isArray(removeResponse.data.comment.reaction)
                    ? removeResponse.data.comment.reaction
                    : [];
                }
                // Update userReaction from API response or derive from reaction array
                if (removeResponse.data.comment.userReaction !== undefined) {
                  // Normalize userReaction from API response
                  updatedComment.userReaction = typeof removeResponse.data.comment.userReaction === 'string'
                    ? removeResponse.data.comment.userReaction.toLowerCase().trim()
                    : '';
                } else if (Array.isArray(updatedComment.reaction) && profile?.username) {
                  // Derive userReaction from reaction array if not provided
                  const userReaction = updatedComment.reaction.find(
                    (r: CommentReaction) => r.username === profile.username || r.senderName === profile.username
                  );
                  updatedComment.userReaction = userReaction?.type ? userReaction.type.toLowerCase().trim() : '';
                }
                return updatedComment;
              }
              return comment;
            }));
          } else if (removeResponse.data?.reactions) {
            // If API returns reactions directly, update the comment
            // Use setPostCommentsInternal directly to bypass scroll check for reactions
            setPostCommentsInternal((prevComments) => prevComments.map((comment) => {
              if (comment._id === commentId) {
                const updatedComment = { ...comment };
                // Update reaction array from API response
                if (Array.isArray(removeResponse.data.reactions)) {
                  updatedComment.reaction = removeResponse.data.reactions;
                }
                // Find user's reaction
                const userReaction = removeResponse.data.reactions.find(
                  (r: CommentReaction) => r.username === profile?.username || r.senderName === profile?.username
                );
                updatedComment.userReaction = userReaction?.type ? userReaction.type.toLowerCase().trim() : '';
                return updatedComment;
              }
              return comment;
            }));
          } else {
            // If API doesn't return comment data, ensure userReaction is cleared
            // This ensures the icon is removed even if API response doesn't include full comment data
            // Use setPostCommentsInternal directly to bypass scroll check for reactions
            setPostCommentsInternal((prevComments) => prevComments.map((comment) => {
              if (comment._id === commentId) {
                const updatedComment = { ...comment };
                // Ensure userReaction is cleared if user has no reaction
                if (Array.isArray(updatedComment.reaction) && profile?.username) {
                  const userReaction = updatedComment.reaction.find(
                    (r: CommentReaction) => r.username === profile.username || r.senderName === profile.username
                  );
                  updatedComment.userReaction = userReaction?.type ? userReaction.type.toLowerCase().trim() : '';
                } else {
                  updatedComment.userReaction = '';
                }
                return updatedComment;
              }
              return comment;
            }));
          }
        } else {
          // Add/update reaction - use POST endpoint with commentId
          const userTo = postData?.userId || '';
          const reactionBody = {
            userTo: userTo,
            postId: postId,
            commentId: commentId, // This tells backend it's a comment reaction
            type: normalizedReaction,
            previousReaction: currentUserReaction || '',
            postReactions: {},
            profilePicture: profile?.profilePicture || ''
          };
          
          console.log('💾 Saving comment reaction:', reactionBody);
          
          // Use post reaction endpoint with commentId - backend will handle comment reactions
          const apiResponse = await Promise.race([
            postService.addReaction(reactionBody),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout: Reaction save took too long')), 120000)
            )
          ]);
          
          if (!apiResponse || !apiResponse.data) {
            throw new Error('Invalid API response');
          }
          
          console.log('✅ Comment reaction saved:', apiResponse.data);
          
          // Update comment state with API response if it contains updated comment data
          // Use setPostCommentsInternal directly to bypass scroll check for reactions
          if (apiResponse.data?.comment) {
            setPostCommentsInternal((prevComments) => prevComments.map((comment) => {
              if (comment._id === commentId) {
                const updatedComment = { ...comment };
                // Update reaction array from API response
                if (apiResponse.data.comment.reaction) {
                  updatedComment.reaction = Array.isArray(apiResponse.data.comment.reaction)
                    ? apiResponse.data.comment.reaction
                    : [];
                }
                // Update userReaction from API response or derive from reaction array
                if (apiResponse.data.comment.userReaction !== undefined) {
                  // Normalize userReaction from API response
                  updatedComment.userReaction = typeof apiResponse.data.comment.userReaction === 'string'
                    ? apiResponse.data.comment.userReaction.toLowerCase().trim()
                    : '';
                } else if (Array.isArray(updatedComment.reaction) && profile?.username) {
                  // Derive userReaction from reaction array if not provided
                  const userReaction = updatedComment.reaction.find(
                    (r: CommentReaction) => r.username === profile.username || r.senderName === profile.username
                  );
                  updatedComment.userReaction = userReaction?.type ? userReaction.type.toLowerCase().trim() : '';
                }
                return updatedComment;
              }
              return comment;
            }));
          } else if (apiResponse.data?.reactions) {
            // If API returns reactions directly, update the comment
            // Use setPostCommentsInternal directly to bypass scroll check for reactions
            setPostCommentsInternal((prevComments) => prevComments.map((comment) => {
              if (comment._id === commentId) {
                const updatedComment = { ...comment };
                // Update reaction array from API response
                if (Array.isArray(apiResponse.data.reactions)) {
                  updatedComment.reaction = apiResponse.data.reactions;
                }
                // Find user's reaction
                const userReaction = apiResponse.data.reactions.find(
                  (r: CommentReaction) => r.username === profile?.username || r.senderName === profile?.username
                );
                updatedComment.userReaction = userReaction?.type ? userReaction.type.toLowerCase().trim() : '';
                return updatedComment;
              }
              return comment;
            }));
          } else {
            // If API doesn't return comment data, ensure userReaction is set from our optimistic update
            // This ensures the icon displays even if API response doesn't include full comment data
            // Use setPostCommentsInternal directly to bypass scroll check for reactions
            setPostCommentsInternal((prevComments) => prevComments.map((comment) => {
              if (comment._id === commentId) {
                const updatedComment = { ...comment };
                // Ensure userReaction is set from reaction array if not already set
                if (!updatedComment.userReaction && Array.isArray(updatedComment.reaction) && profile?.username) {
                  const userReaction = updatedComment.reaction.find(
                    (r: CommentReaction) => r.username === profile.username || r.senderName === profile.username
                  );
                  updatedComment.userReaction = userReaction?.type || '';
                }
                return updatedComment;
              }
              return comment;
            }));
          }
        }
        
        // Emit socket event for real-time updates
        socketService?.socket?.emit('comment reaction', {
          commentId,
          postId,
          reaction: isRemoving ? '' : normalizedReaction,
          username: profile?.username
        });
      } catch (apiError) {
        // Remove from saving set on error
        savingReactionsRef.current.delete(commentId);
        // If API call fails, revert optimistic update
        console.error('❌ Failed to save comment reaction:', apiError);
        
        // Check if it's a timeout error
        const isTimeout = (apiError as Error)?.message?.includes('timeout') || 
                         (apiError as { code?: string })?.code === 'ECONNABORTED';
        
        const errorMessage = isTimeout 
          ? 'Request timed out. The reaction may still be saved. Please refresh to check.'
          : ((apiError as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save reaction');
        
        Utils.dispatchNotification(errorMessage, 'error', dispatch);
        
        // Revert to the state before the optimistic update
        // Use setPostCommentsInternal directly to bypass scroll check
        setPostCommentsInternal((prev) => {
          return prev.map((comment) => {
            if (comment._id === commentId) {
              // Restore the original comment state
              return originalComment;
            }
            return comment;
          });
        });
        
        // Optionally reload comments to get correct state from server
        // But only if the error suggests the state is corrupted
        if ((apiError as { response?: { status?: number } })?.response?.status === 404) {
          await getPostComments();
        }
      } finally {
        // Always remove from saving set when done
        savingReactionsRef.current.delete(commentId);
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'Failed to add reaction', 'error', dispatch);
      // Reload comments on error
      getPostComments();
    }
  }, [postId, profile?.username, profile?.profilePicture, postData?.userId, getUserReaction, dispatch, getPostComments]);

  const toggleReactionsForComment = useCallback((commentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowReactionsForComment(prev => prev === commentId ? null : commentId);
  }, []);
  

  // Close reactions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside any reaction picker
      const clickedOutside = Object.values(reactionsRefs.current).every((ref) => {
        return !ref || !ref.contains(target);
      });
      
      if (clickedOutside && showReactionsForComment) {
        setShowReactionsForComment(null);
      }
    };

    if (showReactionsForComment) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showReactionsForComment]);

  // Set post data when modal opens
  // CRITICAL: Block updates during scroll to prevent re-renders
  useEffect(() => {
    // If scrolling, defer update until scroll ends
    if (isScrollingRef.current) {
      const checkAndApply = () => {
        if (!isScrollingRef.current) {
          // Scroll ended, apply update
          if (commentsModalIsOpen && currentPost) {
            setPostData(currentPost);
          } else {
            setPostData(null);
          }
        } else {
          setTimeout(checkAndApply, 100);
        }
      };
      setTimeout(checkAndApply, 100);
      return;
    }

    // Not scrolling - apply immediately
    if (commentsModalIsOpen && currentPost) {
      setPostData(currentPost);
    } else {
      setPostData(null);
    }
  }, [commentsModalIsOpen, currentPost]);

  // Keep postCommentsRef in sync with postComments
  // Use useLayoutEffect to update ref synchronously
  // This effect is safe to run during scroll since it only updates refs
  useLayoutEffect(() => {
    postCommentsRef.current = postComments;
  }, [postComments]);

  // Aggressive scroll lock: Completely prevent React updates during scroll
  // This uses a combination of refs and requestAnimationFrame to avoid any React reconciliation
  useEffect(() => {
    const container = commentsContainerRef.current;
    const list = commentsListRef.current;
    if (!container) return;

    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    let rafId: number | null = null;
    let isScrolling = false;
    let lastScrollTime = 0;
    
    // Completely passive scroll handler - no React state updates, only ref updates
    // Optimized for both desktop and mobile (touch) scrolling
    const handleScroll = () => {
      const now = performance.now();
      
      // Adaptive throttling - more aggressive on mobile for better performance
      // Mobile devices benefit from less frequent checks due to touch inertia
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                       (window.innerWidth <= 768);
      const throttleDelay = isMobile ? 100 : 150; // Faster on mobile
      
      if (now - lastScrollTime < throttleDelay) {
        return;
      }
      lastScrollTime = now;
      
      // Mark scrolling started (only update refs, never state)
      if (!isScrolling) {
        isScrolling = true;
        isScrollingRef.current = true;
      }
      
      // Cancel any pending operations
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
        scrollTimeout = null;
      }
      
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      
      // Use RAF to detect scroll end - completely outside React's render cycle
      // Mobile devices need longer debounce due to touch inertia scrolling
      rafId = requestAnimationFrame(() => {
        // Debounce scroll end detection - longer on mobile for touch inertia
        // Increased delay on mobile to account for momentum scrolling
        const debounceDelay = isMobile ? 400 : 250;
        scrollTimeout = setTimeout(() => {
          // Double-check that scrolling has actually stopped
          // On mobile, touch inertia can cause scroll events after touch ends
          const containerScrollTop = container.scrollTop;
          const listScrollTop = list?.scrollTop || 0;
          
          // Use RAF to check if scroll position is stable
          requestAnimationFrame(() => {
            const newContainerScrollTop = container.scrollTop;
            const newListScrollTop = list?.scrollTop || 0;
            
            // If scroll position changed, we're still scrolling
            if (newContainerScrollTop !== containerScrollTop || newListScrollTop !== listScrollTop) {
              // Still scrolling, reset the timeout
              if (scrollTimeout) {
                clearTimeout(scrollTimeout);
              }
              scrollTimeout = setTimeout(() => {
                isScrolling = false;
                isScrollingRef.current = false;
                scrollTimeout = null;
                rafId = null;
              }, debounceDelay);
              return;
            }
            
            // Scroll has truly stopped
            isScrolling = false;
            isScrollingRef.current = false;
            
            // Only after scroll completely ends, allow React updates
            // This ensures zero re-renders during active scrolling
            scrollTimeout = null;
            rafId = null;
          });
        }, debounceDelay);
      });
    };

    // Use passive listeners with no capture - maximum performance
    // These handlers never trigger React updates, only update refs
    // Passive listeners are critical for mobile touch scrolling performance
    const scrollOptions: AddEventListenerOptions = { 
      passive: true, 
      capture: false 
    };
    
    container.addEventListener('scroll', handleScroll, scrollOptions);
    
    // Add touch event listeners for better mobile scroll detection
    // Touch events fire before scroll events, giving us earlier detection
    const handleTouchStart = () => {
      isScrolling = true;
      isScrollingRef.current = true;
    };
    
    const handleTouchEnd = () => {
      // Touch ended, but scroll might continue due to inertia
      // Let the scroll handler detect when it truly stops
    };
    
    // Use passive listeners for touch events too
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    if (list) {
      list.addEventListener('scroll', handleScroll, scrollOptions);
      list.addEventListener('touchstart', handleTouchStart, { passive: true });
      list.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      if (list) {
        list.removeEventListener('scroll', handleScroll);
        list.removeEventListener('touchstart', handleTouchStart);
        list.removeEventListener('touchend', handleTouchEnd);
      }
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // Load comments when modal opens or post ID changes
  // CRITICAL: This effect should ONLY run when modal opens or postId changes
  // NOT on every render. We use refs to track state and prevent duplicate calls.
  useEffect(() => {
    // CRITICAL: If scrolling, completely skip this effect
    // Comments should already be loaded, we don't need to reload during scroll
    if (isScrollingRef.current) {
      return;
    }
    
    // Skip if modal is not open or no postId
    if (!commentsModalIsOpen || !postId) {
      if (commentsModalIsOpen === false || !postId) {
        setPostComments([]);
        lastLoadedPostIdRef.current = undefined;
        isLoadingCommentsRef.current = false;
        currentFetchingPostIdRef.current = undefined;
        fetchTokenRef.current = 0;
      }
      return;
    }
    
    // CRITICAL: Check guards FIRST before any other logic
    // This prevents race conditions when effect runs multiple times
    if (currentFetchingPostIdRef.current === postId) {
      // Already fetching for this postId, skip
      return;
    }
    
    if (lastLoadedPostIdRef.current === postId && !isLoadingCommentsRef.current) {
      // Already loaded this postId and not loading, skip
      return;
    }
    
    // Generate unique fetch token for this fetch attempt
    const currentFetchToken = ++fetchTokenRef.current;
    
    // Set ALL guards synchronously BEFORE async call to prevent race conditions
    // Check previous postId before updating to avoid clearing comments unnecessarily
    const previousPostId = lastLoadedPostIdRef.current;
    isLoadingCommentsRef.current = true;
    currentFetchingPostIdRef.current = postId;
    lastLoadedPostIdRef.current = postId;
    
    // Only clear comments if postId changed or we have no comments
    // This prevents clearing comments during scrolling when effect re-runs for same postId
    if (previousPostId !== postId || postComments.length === 0) {
      setPostComments([]);
    }
    
    // Call the API directly to avoid dependency issues
    const fetchComments = async () => {
      try {
        const response = await postService.getPostComments(postId);
        
        // CRITICAL: Check if this fetch token is still valid (not superseded by a newer fetch)
        if (fetchTokenRef.current !== currentFetchToken) {
          return; // Another fetch started, ignore this stale result
        }
        
        // Double-check that we're still fetching for this postId
        if (currentFetchingPostIdRef.current !== postId) {
          return; // Another fetch started, ignore this result
        }
        
        // Process and set comments immediately - this is the initial load, no deferral
        processCommentsResponse(response);
      } catch (error) {
        // CRITICAL: Check if this fetch token is still valid
        if (fetchTokenRef.current !== currentFetchToken) {
          return; // Another fetch started, ignore this stale error
        }
        
        // Double-check that we're still fetching for this postId
        if (currentFetchingPostIdRef.current !== postId) {
          return; // Another fetch started, ignore this error
        }
        
        console.error('❌ Error fetching post comments:', error);
        const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
        if (axiosError?.response?.status !== 404) {
          Utils.dispatchNotification(axiosError?.response?.data?.message || 'Failed to load comments', 'error', dispatch);
        }
        setPostComments([]);
      } finally {
        // Only clear loading guard if this is still the current request
        if (fetchTokenRef.current === currentFetchToken && currentFetchingPostIdRef.current === postId) {
          isLoadingCommentsRef.current = false;
          currentFetchingPostIdRef.current = undefined;
        }
      }
    };
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentsModalIsOpen, postId]);
  
  // Use refs to access latest values in socket handler without causing re-renders
  const postIdRef = useRef<string | undefined>(postId);
  const commentsModalIsOpenRef = useRef<boolean>(commentsModalIsOpen);
  
  // Keep refs in sync - use useLayoutEffect for synchronous updates
  // Refs don't cause re-renders, so this is safe during scroll
  // This effect is safe to run during scroll since it only updates refs
  useLayoutEffect(() => {
    postIdRef.current = postId;
    commentsModalIsOpenRef.current = commentsModalIsOpen;
  }, [postId, commentsModalIsOpen]);
  
  // Also listen for socket updates to refresh comments
  // Memoize handler to prevent recreation on every render
  const handleCommentUpdateRef = useRef<((commentData: unknown) => void) | null>(null);
  
  useEffect(() => {
    if (!commentsModalIsOpen || !postId) return;
    
    const socket = socketService?.socket;
    if (!socket) return;
    
    // Create handler once and reuse it
    if (!handleCommentUpdateRef.current) {
      handleCommentUpdateRef.current = (commentData: unknown) => {
      // Handle both 'comment' event (from backend) and 'update comment' event
      // Backend emits 'comment' with the comment object directly
      let actualComment: CommentData | undefined;
      let actualPostId: string | undefined;
      
      // Use refs to get latest values without dependencies
      const currentPostId = postIdRef.current;
      
      // Removed logging to prevent re-renders during scroll
      
      // Check if it's the wrapped format (from 'update comment')
      if (commentData && typeof commentData === 'object' && 'postId' in commentData) {
        const wrapped = commentData as { postId?: string; comment?: CommentData; commentsCount?: number };
        if (wrapped.postId) {
          actualPostId = wrapped.postId;
          actualComment = wrapped.comment;
          // Removed logging to prevent re-renders
        }
      } 
      // Check if it's the direct comment format (from 'comment' event - backend emits this)
      else if (commentData && typeof commentData === 'object' && '_id' in commentData) {
        const directComment = commentData as CommentData & { postId?: string; post_id?: string };
        // Check both postId and post_id (backend might send either)
        const commentPostId = directComment.postId || directComment.post_id;
        if (commentPostId) {
          // Ensure gifUrl is preserved from the socket event
          actualComment = {
            ...directComment,
            gifUrl: directComment.gifUrl // Preserve gifUrl from socket
          } as CommentData;
          actualPostId = commentPostId;
          // Removed logging to prevent re-renders
        } else {
          // If no postId in comment, but we have a postId in state, assume it's for this post
          // This handles cases where backend doesn't include postId in the comment object
          if (currentPostId) {
            actualComment = {
              ...directComment,
              gifUrl: directComment.gifUrl
            } as CommentData;
            actualPostId = currentPostId; // Use current postId
            // Removed logging to prevent re-renders
          }
        }
      }
      
      // Compare postIds - handle both string and ObjectId formats
      // Also allow comments without postId if we're in the comments modal (assume they're for this post)
      let postIdsMatch = false;
      
      if (actualPostId && currentPostId) {
        // Try multiple comparison methods
        postIdsMatch = (
          actualPostId === currentPostId || 
          String(actualPostId) === String(currentPostId) ||
          actualPostId.toString() === currentPostId.toString()
        );
      } else if (!actualPostId && currentPostId && actualComment) {
        // If socket event has no postId but we're in a modal, assume it's for this post
        // This handles cases where backend doesn't include postId in socket event
        postIdsMatch = true;
        actualPostId = currentPostId; // Set it for consistency
        // Removed logging to prevent re-renders
      }
      
      // Also check if comment object itself has postId field
      if (!postIdsMatch && actualComment && 'postId' in actualComment) {
        const commentPostId = (actualComment as { postId?: string | unknown }).postId;
        if (commentPostId && currentPostId) {
          postIdsMatch = (
            commentPostId === currentPostId ||
            String(commentPostId) === String(currentPostId) ||
            commentPostId.toString() === currentPostId.toString()
          );
          if (postIdsMatch) {
            actualPostId = String(commentPostId);
          }
        }
      }
      
      // Process comment if postIds match OR if we're in the modal and comment has no postId (assume it's for this post)
      // If we have a comment but postId doesn't match, log it for debugging
      // Removed logging to prevent re-renders during scroll
      
      if (postIdsMatch && actualComment && actualComment._id) {
        // Don't update state if user is currently scrolling (defer until scroll ends)
        // Use longer delay on mobile for touch inertia
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                         (window.innerWidth <= 768);
        const scrollDebounceDelay = isMobile ? 500 : 300; // Longer on mobile for touch inertia
        
        if (isScrollingRef.current) {
          // Queue the update for after scrolling ends
          // Use a more reliable check that waits for scroll to fully stop
          const checkAndApply = () => {
            if (!isScrollingRef.current) {
              // Scroll has ended, apply the update
              const currentComments = postCommentsRef.current;
              const existsById = currentComments.some((c) => c._id === actualComment!._id);
              if (!existsById) {
                startTransition(() => {
                  setPostComments((prev) => {
                    // Use the same logic as below but check again for duplicates
                    const stillExists = prev.some((c) => c._id === actualComment!._id);
                    if (stillExists) return prev;
                    
                    // Add comment and sort (same logic as below)
                    const updated = [...prev, actualComment];
                    updated.sort((a, b) => {
                      const aTime = a.createdAt && (typeof a.createdAt === 'string' || a.createdAt instanceof Date)
                        ? new Date(a.createdAt).getTime() 
                        : Date.now();
                      const bTime = b.createdAt && (typeof b.createdAt === 'string' || b.createdAt instanceof Date)
                        ? new Date(b.createdAt).getTime() 
                        : Date.now();
                      return aTime - bTime;
                    });
                    if (actualComment._id) {
                      lastAddedCommentId.current = actualComment._id;
                      shouldScrollToCommentRef.current = actualComment._id;
                    }
                    return updated;
                  });
                });
              }
            } else {
              // Still scrolling, check again after delay
              setTimeout(checkAndApply, scrollDebounceDelay);
            }
          };
          setTimeout(checkAndApply, scrollDebounceDelay);
          return; // Skip immediate update during scroll
        }
        
        // Removed logging to prevent re-renders during scroll
        
        startTransition(() => {
        setPostComments((prev) => {
          // First check: does this comment ID already exist?
          const existsById = prev.some((c) => c._id === actualComment!._id);
          if (existsById) {
            // Comment already exists, skip
            return prev;
          }
          
          // For GIFs, ALWAYS check if we have an existing comment with same GIF + user
          // If same GIF URL and same username, it's the same comment - replace it
          if (actualComment.gifUrl) {
            // Find ANY comment with same GIF URL and same username
            // This catches both optimistic updates and any duplicates
            const existingIndex = prev.findIndex((c) => {
              return c.gifUrl === actualComment!.gifUrl && c.username === actualComment!.username;
            });
            
            if (existingIndex !== -1) {
              // Replace existing comment with real one from socket
              // This prevents duplicates - same GIF + same user = same comment
              // Replacing existing GIF comment (same GIF + user)
              const updated = [...prev];
              updated[existingIndex] = {
                ...actualComment,
                gifUrl: actualComment.gifUrl
              };
              updated.sort((a, b) => {
                const aTime = a.createdAt && (typeof a.createdAt === 'string' || a.createdAt instanceof Date)
                  ? new Date(a.createdAt).getTime() 
                  : Date.now();
                const bTime = b.createdAt && (typeof b.createdAt === 'string' || b.createdAt instanceof Date)
                  ? new Date(b.createdAt).getTime() 
                  : Date.now();
                return aTime - bTime;
              });
              if (actualComment._id) {
                lastAddedCommentId.current = actualComment._id;
                  shouldScrollToCommentRef.current = actualComment._id;
              }
              return updated; // Return early - don't add as new comment
            }
          }
          
          // For text comments, check for duplicates
          if (!actualComment.gifUrl) {
            const duplicateText = prev.some((c) => {
              if (c._id === actualComment!._id) return true;
              if (c.comment !== actualComment!.comment || c.username !== actualComment!.username) return false;
              if (c.gifUrl) return false; // Different if one has GIF and other doesn't
              
              // Check timestamp
              if (c.createdAt && actualComment.createdAt) {
                try {
                  const timeDiff = Math.abs(
                    new Date(c.createdAt).getTime() - new Date(actualComment.createdAt).getTime()
                  );
                  return timeDiff < 5000; // Within 5 seconds
                } catch {
                  return true; // If date parsing fails, consider duplicate
                }
              }
              return true; // Same content = duplicate
            });
            
            if (duplicateText) {
              // Duplicate text comment detected, skipping
              return prev;
            }
          }
          
          // Adding new comment from socket (removed logging to prevent re-renders)
          
          // Store ID for scrolling (use separate ref to avoid triggering effect unnecessarily)
          if (actualComment._id) {
            lastAddedCommentId.current = actualComment._id;
            shouldScrollToCommentRef.current = actualComment._id;
          }
          
          // Add comment and sort
          const updated = [...prev, actualComment];
          updated.sort((a, b) => {
            const aTime = a.createdAt && (typeof a.createdAt === 'string' || a.createdAt instanceof Date)
              ? new Date(a.createdAt).getTime() 
              : Date.now();
            const bTime = b.createdAt && (typeof b.createdAt === 'string' || b.createdAt instanceof Date)
              ? new Date(b.createdAt).getTime() 
              : Date.now();
            return aTime - bTime;
          });
          return updated;
        });
        });
      }
    };
    }
    
    const handler = handleCommentUpdateRef.current;
    
    // Handle comment reaction updates from socket
    const handleCommentReaction = (data: { commentId: string; reaction: string; username: string }) => {
      if (!data.commentId || !postId) return;
      
      // Normalize reaction type from socket data
      const normalizedSocketReaction = data.reaction ? data.reaction.toLowerCase().trim() : '';
      
      // Don't update if user is scrolling - defer until scroll ends
      if (isScrollingRef.current) {
        const applyUpdate = () => {
          if (!isScrollingRef.current) {
            setPostComments((prevComments) => prevComments.map((comment) => {
              if (comment._id === data.commentId) {
                const updatedComment = cloneDeep(comment);
                const currentReactions = (updatedComment.reaction as CommentReaction[]) || [];
                
                if (!normalizedSocketReaction || normalizedSocketReaction === '') {
                  // Remove reaction
                  updatedComment.reaction = currentReactions.filter(
                    (r: CommentReaction) => r.username !== data.username && r.senderName !== data.username
                  );
                  if (data.username === profile?.username) {
                    updatedComment.userReaction = '';
                  }
                } else {
                  // Add or update reaction
                  const existingIndex = currentReactions.findIndex(
                    (r: CommentReaction) => r.username === data.username || r.senderName === data.username
                  );
                  
                  const newReaction: CommentReaction = {
                    senderName: data.username,
                    username: data.username,
                    type: normalizedSocketReaction
                  };
                  
                  if (existingIndex > -1) {
                    const updatedReactions = [...currentReactions];
                    updatedReactions[existingIndex] = newReaction;
                    updatedComment.reaction = updatedReactions;
                  } else {
                    updatedComment.reaction = [...currentReactions, newReaction];
                  }
                  
                  if (data.username === profile?.username) {
                    updatedComment.userReaction = normalizedSocketReaction;
                  }
                }
                
                return updatedComment;
              }
              return comment;
            }));
          } else {
            setTimeout(applyUpdate, 100);
          }
        };
        setTimeout(applyUpdate, 100);
      } else {
        // Not scrolling - apply update immediately
        setPostComments((prevComments) => prevComments.map((comment) => {
          if (comment._id === data.commentId) {
            const updatedComment = cloneDeep(comment);
            const currentReactions = (updatedComment.reaction as CommentReaction[]) || [];
            
            if (!data.reaction || data.reaction === '') {
              // Remove reaction
              updatedComment.reaction = currentReactions.filter(
                (r: CommentReaction) => r.username !== data.username && r.senderName !== data.username
              );
              if (data.username === profile?.username) {
                updatedComment.userReaction = '';
              }
            } else {
              // Add or update reaction
              const existingIndex = currentReactions.findIndex(
                (r: CommentReaction) => r.username === data.username || r.senderName === data.username
              );
              
              const newReaction: CommentReaction = {
                senderName: data.username,
                username: data.username,
                type: data.reaction
              };
              
              if (existingIndex > -1) {
                const updatedReactions = [...currentReactions];
                updatedReactions[existingIndex] = newReaction;
                updatedComment.reaction = updatedReactions;
              } else {
                updatedComment.reaction = [...currentReactions, newReaction];
              }
              
              if (data.username === profile?.username) {
                updatedComment.userReaction = data.reaction;
              }
            }
            
            return updatedComment;
          }
          return comment;
        }));
      }
    };
    
    // Listen to socket events
    socket.on('update comment', handler);
    socket.on('comment', handler);
    socket.on('comment reaction', handleCommentReaction);
    
    return () => {
      socket.off('update comment', handler);
      socket.off('comment', handler);
      socket.off('comment reaction', handleCommentReaction);
    };
    // Only recreate when modal opens/closes or postId changes, not on every render
  }, [commentsModalIsOpen, postId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Memoize onCommentAdded callback to prevent CommentInputBox re-renders
  const handleCommentAdded = useCallback((comment: CommentData) => {
    // Add comment immediately (optimistic update) for both text and GIF comments
    
    // Don't update if user is scrolling - defer until scroll ends
    if (isScrollingRef.current) {
      // Queue the optimistic update for after scrolling
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                       (window.innerWidth <= 768);
      const scrollDebounceDelay = isMobile ? 500 : 300;
      
      const checkAndApply = () => {
        if (!isScrollingRef.current) {
          // Scroll has ended, apply the optimistic update
          startTransition(() => {
            setPostComments((prev) => {
              const existsById = prev.some((c) => c._id === comment._id);
              if (existsById) return prev;
              
              // Apply the same logic as below
              if (comment.gifUrl) {
                const recentDuplicate = prev.find((c) => {
                  if (c.gifUrl !== comment.gifUrl || c.username !== comment.username) {
                    return false;
                  }
                  if (c.createdAt && comment.createdAt) {
                    try {
                      const timeDiff = Math.abs(
                        new Date(c.createdAt).getTime() - new Date(comment.createdAt).getTime()
                      );
                      return timeDiff < 5000;
                    } catch {
                      // If date parsing fails, don't block
                    }
                  }
                  return false;
                });
                
                if (recentDuplicate) {
                  return prev;
                }
              }
              
              if (comment._id) {
                lastAddedCommentId.current = comment._id;
                shouldScrollToCommentRef.current = comment._id;
              }
              
              const updated = [...prev, comment];
              updated.sort((a, b) => {
                const aTime = a.createdAt && (typeof a.createdAt === 'string' || a.createdAt instanceof Date)
                  ? new Date(a.createdAt).getTime() 
                  : Date.now();
                const bTime = b.createdAt && (typeof b.createdAt === 'string' || b.createdAt instanceof Date)
                  ? new Date(b.createdAt).getTime() 
                  : Date.now();
                return aTime - bTime;
              });
              return updated;
            });
          });
        } else {
          // Still scrolling, check again
          setTimeout(checkAndApply, scrollDebounceDelay);
        }
      };
      setTimeout(checkAndApply, scrollDebounceDelay);
      return; // Skip immediate update during scroll
    }
    
    startTransition(() => {
      setPostComments((prev) => {
        // Check by ID first
        const existsById = prev.some((c) => c._id === comment._id);
        if (existsById) {
          // Comment already exists, skip
          return prev;
        }
        
        // For GIFs, check if we already have this exact GIF from this user very recently
        // This prevents the optimistic update from adding if socket already added it
        if (comment.gifUrl) {
          const recentDuplicate = prev.find((c) => {
            if (c.gifUrl !== comment.gifUrl || c.username !== comment.username) {
              return false;
            }
            // Check if it's within the last 5 seconds (increased window for socket events)
            if (c.createdAt && comment.createdAt) {
              try {
                const timeDiff = Math.abs(
                  new Date(c.createdAt).getTime() - new Date(comment.createdAt).getTime()
                );
                return timeDiff < 5000; // Within 5 seconds
              } catch {
                // If date parsing fails, don't block
              }
            }
            return false; // Don't block if we can't verify timestamp
          });
          
          if (recentDuplicate) {
            // Recent duplicate GIF comment in optimistic update, skipping
            return prev;
          }
        }
        
        // Store ID for scrolling
        if (comment._id) {
          lastAddedCommentId.current = comment._id;
          shouldScrollToCommentRef.current = comment._id;
        }
        
        // Adding comment optimistically (removed logging to prevent re-renders)
        
        // Add comment and sort
        const updated = [...prev, comment];
        updated.sort((a, b) => {
          const aTime = a.createdAt && (typeof a.createdAt === 'string' || a.createdAt instanceof Date)
            ? new Date(a.createdAt).getTime() 
            : Date.now();
          const bTime = b.createdAt && (typeof b.createdAt === 'string' || b.createdAt instanceof Date)
            ? new Date(b.createdAt).getTime() 
            : Date.now();
          return aTime - bTime;
        });
        return updated;
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Track previous comments length to detect new comments without causing re-renders
  const prevCommentsLengthRef = useRef<number>(0);
  const shouldScrollToCommentRef = useRef<string | null>(null);
  
  // Scroll to newly added comment - only when a new comment is actually added
  useEffect(() => {
    // Only scroll if comments length increased (new comment added) and we have a scroll target
    const commentIdToScroll = shouldScrollToCommentRef.current || lastAddedCommentId.current;
    const commentsLengthIncreased = postComments.length > prevCommentsLengthRef.current;
    
    if (commentIdToScroll && commentsLengthIncreased) {
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
      setTimeout(() => {
          const commentElement = commentRefs.current[commentIdToScroll];
        if (commentElement && commentsContainerRef.current) {
          commentElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            // Reset refs after scrolling
          lastAddedCommentId.current = null;
            shouldScrollToCommentRef.current = null;
        }
      }, 100);
      });
    }
    
    // Update previous length
    prevCommentsLengthRef.current = postComments.length;
  }, [postComments.length]);

  // Create a stable key based on comment IDs and showReactionsForComment
  // This ensures useMemo only recalculates when comments actually change
  // Use ref to track previous IDs to avoid recalculating unnecessarily
  const prevCommentIdsRef = useRef<string>('');
  const commentsKey = useMemo(() => {
    const ids = postComments.map(c => c._id || c.id || '').filter(Boolean).join(',');
    const count = postComments.length;
    
    // Only recalculate if IDs or count actually changed
    // Reuse prevCommentsLengthRef that's already declared above
    if (ids !== prevCommentIdsRef.current || count !== prevCommentsLengthRef.current) {
      prevCommentIdsRef.current = ids;
      prevCommentsLengthRef.current = count;
    }
    
    // Use count and first/last few IDs for key (more stable than full list)
    const keyIds = ids.length > 200 ? `${ids.substring(0, 100)}...${ids.substring(ids.length - 100)}` : ids;
    return `${count}:${keyIds}|${showReactionsForComment || ''}`;
    // Only depend on postComments.length and showReactionsForComment
    // The IDs comparison is done inside using refs to avoid unnecessary recalculations
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postComments.length, showReactionsForComment]);
  
  // Memoize comments list - only recalculate when commentsKey changes
  // This prevents recalculation during scroll or other unrelated state updates
  const memoizedComments = useMemo(() => {
    const newComments = postComments
      .filter((commentData) => {
        // Filter out comments without valid IDs
        // Be lenient with content - allow comments with just GIFs or empty text
        const hasId = commentData?._id || commentData?.id;
        
        // Only require ID - allow comments even without content or username (they'll just display empty)
        return !!hasId;
      })
      .map((commentData) => {
        const commentId: string = String(commentData?._id || commentData?.id || '');
        const userReaction = getUserReaction(commentData);
      // Use reaction array (like chat) or reactions object
      const totalReactions = getTotalReactionsCount(commentData.reaction || commentData.reactions);
      const gifUrl = commentData?.gifUrl && typeof commentData.gifUrl === 'string' ? commentData.gifUrl : null;
      
      return (
        <CommentListItem
          key={commentId}
          commentId={commentId}
          commentData={commentData}
          userReaction={userReaction}
          totalReactions={totalReactions}
          gifUrl={gifUrl}
          showReactionsForComment={showReactionsForComment}
          toggleReactionsForComment={toggleReactionsForComment}
          addCommentReaction={addCommentReaction}
          reactionsRefs={reactionsRefs}
          commentRefs={commentRefs}
          reactionsMap={reactionsMap}
        />
      );
    });
    
    // Memoized comments (removed logging to prevent re-renders)
    return newComments;
    // Only depend on commentsKey - this is a stable string that only changes when comments/reactions actually change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentsKey]);

  // Removed debug logging to prevent re-renders during scroll

  if (!commentsModalIsOpen) {
    return null;
  }

  return (
    <ReactionWrapper closeModal={closeCommentsModal}>
      <div></div>
      <div className="modal-comments-content">
        {/* Post Display */}
        {postData ? (
          <div className="modal-post-display">
            <button 
              className="modal-close-button" 
              onClick={closeCommentsModal}
              aria-label="Close modal"
            >
              ×
            </button>
            <div className="modal-post-header">
              <div 
                className="modal-post-avatar"
                onClick={() => {
                  if (postData?.username) {
                    ProfileUtils.navigateToProfile({ 
                      username: postData.username, 
                      _id: postData.userId as string,
                      uId: postData.uId as string
                    }, navigate);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <Avatar
                  name={postData?.username}
                  bgColor={postData?.avatarColor}
                  textColor="#ffffff"
                  size={40}
                  avatarSrc={postData?.profilePicture}
                />
              </div>
              <div className="modal-post-info">
                <h5 
                  onClick={() => {
                    if (postData?.username) {
                      ProfileUtils.navigateToProfile({ 
                        username: postData.username, 
                        _id: postData.userId as string,
                        uId: postData.uId as string
                      }, navigate);
                    }
                  }}
                  style={{ cursor: 'pointer', margin: 0 }}
                >
                  {postData?.username}
                </h5>
                {postData?.createdAt && (
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--gray-8)' }}>
                    {timeAgo.transform(postData.createdAt)} {getPrivacy(postData?.privacy)}
                  </p>
                )}
              </div>
            </div>
            <div className="modal-post-body">
              {postData?.post && postData?.bgColor === '#ffffff' && <p>{postData.post}</p>}
              {postData?.post && postData?.bgColor !== '#ffffff' && (
                <div className="user-post-with-bg" style={{ backgroundColor: `${postData?.bgColor}`, padding: '12px', borderRadius: '8px' }}>
                  {postData.post}
                </div>
              )}
              {postGifUrl && (
                <div className="image-display-flex">
                  <img className="post-image" src={postGifUrl} alt="" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                </div>
              )}
              {postImageUrl && (
                <div className="image-display-flex">
                  <img 
                    className="post-image" 
                    src={postImageUrl} 
                    alt="" 
                    style={{ maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }}
                  />
                </div>
              )}
              {postFallbackImageUrl && (
                <div className="image-display-flex">
                  <img 
                    className="post-image" 
                    src={postFallbackImageUrl} 
                    alt=""
                    style={{ maxWidth: '100%', borderRadius: '8px' }}
                  />
                </div>
              )}
              {postVideoUrl && (
                <div className="image-display-flex">
                  <video 
                    width="100%" 
                    height="auto" 
                    controls 
                    src={postVideoUrl}
                    style={{ borderRadius: '8px' }}
                  />
                </div>
              )}
            </div>
          </div>
        ) : postId ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-8)' }}>
            Loading post...
          </div>
        ) : null}
        
        {/* Comments Section */}
        <div 
          className="modal-comments-container"
          ref={commentsContainerRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0, // Critical for flex scrolling
            maxHeight: 'none', // Remove constraint
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '25px 30px',
            flex: '1 1 auto' // Allow flex to shrink and grow
          }}
        >
          {!postId ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
              ⚠️ Error: Post ID is missing. Cannot load comments.
            </div>
          ) : postComments.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-8)' }}>
              No comments yet. Be the first to comment!
            </div>
          ) : memoizedComments.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-8)' }}>
              Comments are loading... ({postComments.length} comments found)
            </div>
          ) : (
            <ul 
              className="modal-comments-container-list" 
              ref={commentsListRef}
              style={{ 
                display: 'block',
                visibility: 'visible',
                opacity: 1,
                minHeight: '50px'
              }}
            >
              {memoizedComments}
            </ul>
          )}
        </div>
        
        {/* Comment Input Box */}
        {postData && postId && (
          <div className="modal-comment-input-wrapper">
            <CommentInputBox 
              post={postData} 
              onCommentAdded={handleCommentAdded}
            />
          </div>
        )}
      </div>
    </ReactionWrapper>
  );
};

// Memoize the component to prevent re-renders when parent re-renders
// Since CommentsModal doesn't receive props, it only re-renders when Redux state changes
// This memoization ensures parent re-renders don't cause unnecessary re-renders
// CRITICAL: The component uses internal guards to prevent state updates during scroll,
// but we can't prevent Redux-triggered re-renders here. The scroll lock mechanism
// inside the component defers state updates during scroll, which prevents visual glitches.
export default memo(CommentsModal);

