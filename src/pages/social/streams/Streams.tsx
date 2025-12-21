import { useState, useRef, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { uniqBy } from 'lodash';
import Suggestions from '@components/suggestions/Suggestions';
import PostForm from '@components/posts/post-form/PostForm';
import Posts from '@components/posts/Posts';
import { postService } from '@services/api/post/post.service';
import { followerService } from '@services/api/followers/follower.service';
import { Utils } from '@services/utils/utils.service';
import { getUserSuggestions } from '@redux/api/suggestion';
import { getPosts } from '@redux/api/posts';
import { addReactions } from '@redux/reducers/post/userPostReactionSlice';
import { removePost, updatePostInList, addToPosts } from '@redux/reducers/posts/postsSlice';
import { socketService } from '@services/socket/socket.service';
import useEffectOnce from '@hooks/useEffectOnce';
import useInfiniteScroll from '@hooks/useInfiniteScroll';
import useLocalStorage from '@hooks/useLocalStorage';
import type { RootState, AppDispatch } from '@redux/store';
import './Streams.scss';

const Streams = () => {
  const allPosts = useSelector((state: RootState) => state.allPosts);
  const bodyRef = useRef<HTMLDivElement>(null);
  const bottomLineRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const [posts, setPosts] = useState<unknown[]>([]);
  const [following, setFollowing] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPostsCount, setTotalPostsCount] = useState(0);
  const appPosts = useRef<unknown[]>([]);
  const initialLoadCompleteRef = useRef(false);
  const PAGE_SIZE = 10;

  const storedUsername = useLocalStorage('username', 'get');
  const [deleteSelectedPostId] = useLocalStorage('selectedPostId', 'delete') as [() => void];

  const getAllPosts = async (page: number = currentPage) => {
    try {
      const response = await postService.getAllPosts(page);
      if (response.data.posts && response.data.posts.length >= 0) {
        // Always update posts, even if empty array (to clear state properly)
        if (page === 1) {
          // First page - replace posts
          appPosts.current = response.data.posts;
          setPosts(response.data.posts);
          // Also update Redux state
          dispatch(addToPosts(response.data.posts));
        } else {
          // Subsequent pages - append posts to accumulated posts
          // Use appPosts.current instead of posts state to ensure we have all previously loaded posts
          const currentAccumulatedPosts = appPosts.current || [];
          appPosts.current = [...currentAccumulatedPosts, ...response.data.posts];
          const allPosts = uniqBy(appPosts.current, '_id');
          setPosts(allPosts);
          // Also update Redux state with all accumulated posts
          dispatch(addToPosts(allPosts));
        }
        // Update total count if provided
        if (response.data.totalPosts !== undefined) {
          setTotalPostsCount(response.data.totalPosts);
        }
      }
      setLoading(false);
    } catch (error: unknown) {
      setLoading(false);
      const axiosError = error as { 
        response?: { 
          status?: number;
          data?: { message?: string } 
        };
        message?: string;
      };
      
      // Provide more specific error messages
      let errorMessage = 'An error occurred while loading posts';
      
      if (axiosError.response?.status === 403) {
        errorMessage = 'Access forbidden. Please check your authentication or try logging in again.';
      } else if (axiosError.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      } else if (axiosError.message) {
        errorMessage = axiosError.message;
      }
      
      Utils.dispatchNotification(errorMessage, 'error', dispatch);
    }
  };

  const getReactionsByUsername = async () => {
    try {
      if (storedUsername && typeof storedUsername === 'string') {
        const response = await postService.getReactionsByUsername(storedUsername);
        dispatch(addReactions(response.data.reactions));
      }
    } catch (error: unknown) {
      // Silently fail for reactions - not critical for page functionality
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      if (axiosError.response?.status === 403 || axiosError.response?.status === 401) {
        // Only log auth errors, don't show notification for reactions
        console.warn('Failed to load reactions:', axiosError.response?.data?.message || 'Authentication issue');
      }
    }
  };

  const getUserFollowing = async () => {
    try {
      const response = await followerService.getUserFollowing();
      setFollowing(response.data.following);
    } catch (error: unknown) {
      // Silently fail for following list - not critical for page functionality
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      if (axiosError.response?.status === 403 || axiosError.response?.status === 401) {
        // Only log auth errors, don't show notification for following list
        console.warn('Failed to load following list:', axiosError.response?.data?.message || 'Authentication issue');
      }
    }
  };

  const fetchPostData = () => {
    let pageNum = currentPage;
    if (currentPage <= Math.round(totalPostsCount / PAGE_SIZE)) {
      pageNum += 1;
      setCurrentPage(pageNum);
      getAllPosts(pageNum);
    }
  };

  useInfiniteScroll(bodyRef as React.RefObject<HTMLElement>, bottomLineRef as React.RefObject<HTMLElement>, fetchPostData);

  useEffectOnce(() => {
    // Reset initial load flag on mount (page refresh)
    initialLoadCompleteRef.current = false;
    
    getReactionsByUsername();
    deleteSelectedPostId();
    // Fetch posts via Redux and also directly as fallback
    dispatch(getPosts(1)).catch(() => {
      // If Redux fetch fails, try direct API call
      getAllPosts(1);
    });
    dispatch(getUserSuggestions());
    getUserFollowing();
  });

  const derivedLoading = useMemo(() => allPosts?.isLoading || false, [allPosts?.isLoading]);
  const derivedPosts = useMemo(() => allPosts?.posts || [], [allPosts?.posts]);
  const derivedTotalPostsCount = useMemo(() => allPosts?.totalPostsCount || 0, [allPosts?.totalPostsCount]);

  // Sync local posts state with Redux state when Redux updates
  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setLoading(derivedLoading);
      
      // On initial load (refresh), always sync from Redux when loading completes
      // This ensures posts are loaded on page refresh
      if (!initialLoadCompleteRef.current) {
        if (!derivedLoading) {
          // Initial load complete - sync posts from Redux (even if empty)
          // This is critical for page refresh - we need to load posts from Redux
          setPosts(derivedPosts);
          appPosts.current = derivedPosts;
          initialLoadCompleteRef.current = true;
        }
      } 
      // After initial load, preserve accumulated posts from infinite scroll
      // Only merge Redux posts if they contain new posts (e.g., from socket events)
      else if (derivedPosts.length > 0) {
        const currentPostsLength = appPosts.current?.length || 0;
        const currentPostIds = new Set((appPosts.current || []).map((p: unknown) => (p as { _id?: string })?._id));
        
        // Check if Redux has new posts that we don't have (e.g., socket event)
        const hasNewPosts = derivedPosts.some((p: unknown) => {
          const postId = (p as { _id?: string })?._id;
          return postId && !currentPostIds.has(postId);
        });
        
        // Only update if Redux has new posts OR if we have fewer posts than Redux
        // This prevents Redux from overwriting accumulated posts from infinite scroll
        if (hasNewPosts) {
          // Merge new posts from Redux with accumulated posts
          const merged = uniqBy([...derivedPosts, ...(appPosts.current || [])], '_id');
          setPosts(merged);
          appPosts.current = merged;
          // Update Redux with merged posts to keep it in sync
          dispatch(addToPosts(merged));
        } else if (derivedPosts.length > currentPostsLength) {
          // Redux has more posts, merge them
          const merged = uniqBy([...derivedPosts, ...(appPosts.current || [])], '_id');
          setPosts(merged);
          appPosts.current = merged;
          dispatch(addToPosts(merged));
        }
        // Otherwise, preserve accumulated posts - don't overwrite with Redux
      }
      // If Redux is empty after initial load but we have posts, preserve existing posts
      // This prevents clearing posts when modal opens or other operations
      
      // Always update total count if provided
      if (derivedTotalPostsCount !== undefined) {
        setTotalPostsCount(derivedTotalPostsCount);
      }
    }, 0);
  }, [derivedLoading, derivedPosts, derivedTotalPostsCount, posts.length, dispatch]);

  // Use ref to store latest posts for socket handlers
  const allPostsRef = useRef(allPosts);
  useEffect(() => {
    allPostsRef.current = allPosts;
  }, [allPosts]);

  useEffect(() => {
    // Setup socket listeners that update Redux (local state will sync automatically)
    if (socketService?.socket) {
      const socket = socketService.socket;

      const handleAddPost = (post: unknown) => {
        const currentPosts = allPostsRef.current?.posts || [];
        const postData = post as { _id?: string; createdAt?: string };
        
        // Check if this post already exists (might be from optimistic update or duplicate socket event)
        const existingPostIndex = currentPosts.findIndex((p: unknown) => {
          const pData = p as { _id?: string };
          return pData._id === postData._id;
        });
        
        // Check for optimistic post (temp ID) that should be replaced
        const optimisticPostIndex = currentPosts.findIndex((p: unknown) => {
          const pData = p as { _id?: string; createdAt?: string };
          // Match by createdAt if temp post exists (within 5 seconds)
          if (pData._id?.startsWith('temp-') && postData.createdAt && pData.createdAt) {
            const timeDiff = Math.abs(new Date(postData.createdAt).getTime() - new Date(pData.createdAt).getTime());
            return timeDiff < 5000; // Within 5 seconds
          }
          return false;
        });
        
        if (optimisticPostIndex > -1) {
          // Replace optimistic post with real post
          const newPosts = [...currentPosts];
          newPosts[optimisticPostIndex] = post;
          dispatch(addToPosts(newPosts));
        } else if (existingPostIndex === -1) {
          // New post that doesn't exist - add to beginning
          dispatch(addToPosts([post, ...currentPosts]));
        } else {
          // Post exists - update it (might have new data from backend)
          dispatch(updatePostInList(post));
        }
      };

      const handleUpdatePost = (post: unknown) => {
        dispatch(updatePostInList(post));
      };

      const handleDeletePost = (postId: string) => {
        dispatch(removePost(postId));
      };

      interface ReactionData {
        postId?: string;
        postReactions?: unknown;
      }

      const handleUpdateLike = (reactionData: ReactionData) => {
        const currentPosts = allPostsRef.current?.posts || [];
        const post = (currentPosts as Array<{ _id?: string; [key: string]: unknown }>).find((p) => p._id === reactionData?.postId);
        if (post) {
          const updatedPost = { ...post, reactions: reactionData.postReactions };
          dispatch(updatePostInList(updatedPost));
        }
      };

      interface CommentData {
        postId?: string;
        commentsCount?: number;
        postReactions?: unknown;
      }

      const handleUpdateComment = (commentData: CommentData) => {
        const currentPosts = allPostsRef.current?.posts || [];
        const post = (currentPosts as Array<{ _id?: string; [key: string]: unknown }>).find((p) => p._id === commentData?.postId);
        if (post) {
          const updatedPost = { 
            ...post, 
            commentsCount: commentData.commentsCount !== undefined ? String(commentData.commentsCount) : post.commentsCount,
            reactions: commentData.postReactions || post.reactions
          };
          dispatch(updatePostInList(updatedPost));
        }
      };

      // Remove existing listeners to avoid duplicates
      socket.off('add post');
      socket.off('update post');
      socket.off('delete post');
      socket.off('update like');
      socket.off('update comment');

      // Add new listeners
      socket.on('add post', handleAddPost);
      socket.on('update post', handleUpdatePost);
      socket.on('delete post', handleDeletePost);
      socket.on('update like', handleUpdateLike);
      socket.on('update comment', handleUpdateComment);

      // Cleanup on unmount
      return () => {
        socket.off('add post', handleAddPost);
        socket.off('update post', handleUpdatePost);
        socket.off('delete post', handleDeletePost);
        socket.off('update like', handleUpdateLike);
        socket.off('update comment', handleUpdateComment);
      };
    }
  }, [dispatch]);

  return (
    <>
      {/* Inline style tag for mobile overrides - ensures production compatibility */}
      {/* This style tag loads with the component and overrides cached CSS */}
      <style>{`
        @media screen and (max-width: 768px) {
          html, body { overflow-x: hidden !important; position: relative !important; width: 100% !important; max-width: 100% !important; min-width: 100% !important; }
          .dashboard { overflow: visible !important; overflow-x: visible !important; overflow-y: visible !important; height: auto !important; }
          .dashboard-content { overflow: visible !important; overflow-x: visible !important; overflow-y: visible !important; height: auto !important; }
          .streams { overflow: visible !important; width: 100% !important; max-width: 100% !important; }
          .streams-content { overflow: visible !important; width: 100% !important; max-width: 100% !important; }
          .streams-post { overflow: visible !important; width: 100% !important; max-width: 100% !important; height: auto !important; }
          .posts-container { overflow: visible !important; width: 100% !important; max-width: 100% !important; }
          .modal-wrapper { padding: 0 !important; max-width: 100vw !important; max-height: 100vh !important; width: 100vw !important; height: 100vh !important; min-width: 100vw !important; overflow-x: hidden !important; overflow-y: auto !important; -webkit-overflow-scrolling: touch !important; position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; justify-content: flex-start !important; align-items: flex-start !important; margin: 0 !important; transform: none !important; inset: 0 !important; }
          .modal-wrapper .modal-box { width: 100vw !important; max-width: 100vw !important; min-width: 100vw !important; max-height: 100vh !important; margin: 0 !important; margin-left: 0 !important; margin-right: 0 !important; margin-top: 0 !important; margin-bottom: 0 !important; padding: 10px !important; border-radius: 0 !important; overflow-x: hidden !important; overflow-y: auto !important; height: auto !important; min-height: auto !important; box-sizing: border-box !important; flex: none !important; flex-shrink: 0 !important; flex-grow: 0 !important; transform: none !important; left: 0 !important; right: 0 !important; top: 0 !important; position: relative !important; align-self: flex-start !important; }
          .modal-box { width: 100vw !important; max-width: 100vw !important; min-width: 100vw !important; max-height: 100vh !important; margin: 0 !important; margin-left: 0 !important; margin-right: 0 !important; margin-top: 0 !important; margin-bottom: 0 !important; padding: 10px !important; border-radius: 0 !important; overflow-x: hidden !important; overflow-y: auto !important; height: auto !important; min-height: auto !important; box-sizing: border-box !important; flex: none !important; flex-shrink: 0 !important; flex-grow: 0 !important; transform: none !important; left: 0 !important; right: 0 !important; top: 0 !important; position: relative !important; align-self: flex-start !important; }
          .modal-box-content { width: 100% !important; max-width: 100% !important; min-width: 100% !important; box-sizing: border-box !important; }
          .modal-box-header { height: auto !important; min-height: 40px !important; padding: 12px 10px !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; }
          .modal-box-header h2 { font-size: 1rem !important; white-space: nowrap !important; }
          .modal-box-header-cancel { height: auto !important; min-height: 40px !important; font-size: 1.25rem !important; }
          .modal-box-button { margin-top: 10px !important; padding: 10px !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; }
        }
      `}</style>
      <div className="streams" data-testid="streams">
        <div className="streams-content">
          <div className="streams-post" ref={bodyRef}>
            <PostForm />
            <Posts allPosts={posts} postsLoading={loading} userFollowing={following} />
            <div ref={bottomLineRef} className="streams-bottom-line"></div>
          </div>
          <div className="streams-suggestions">
            <Suggestions />
          </div>
        </div>
      </div>
    </>
  );
};

export default Streams;

