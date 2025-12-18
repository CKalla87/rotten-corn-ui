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
  const PAGE_SIZE = 10;

  const storedUsername = useLocalStorage('username', 'get');
  const [deleteSelectedPostId] = useLocalStorage('selectedPostId', 'delete') as [() => void];

  const getAllPosts = async (page: number = currentPage) => {
    try {
      const response = await postService.getAllPosts(page);
      if (response.data.posts.length > 0) {
        appPosts.current = [...posts, ...response.data.posts];
        const allPosts = uniqBy(appPosts.current, '_id');
        setPosts(allPosts);
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
    getReactionsByUsername();
    deleteSelectedPostId();
    dispatch(getPosts(1));
    dispatch(getUserSuggestions());
    getUserFollowing();
  });

  const derivedLoading = useMemo(() => allPosts?.isLoading || false, [allPosts?.isLoading]);
  const derivedPosts = useMemo(() => allPosts?.posts || [], [allPosts?.posts]);
  const derivedTotalPostsCount = useMemo(() => allPosts?.totalPostsCount || 0, [allPosts?.totalPostsCount]);

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setLoading(derivedLoading);
      setPosts(derivedPosts);
      setTotalPostsCount(derivedTotalPostsCount);
      // Update appPosts ref when Redux posts change
      appPosts.current = derivedPosts;
    }, 0);
  }, [derivedLoading, derivedPosts, derivedTotalPostsCount]);

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
        dispatch(addToPosts([post, ...currentPosts]));
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

      const handleUpdateComment = (reactionData: CommentData) => {
        const currentPosts = allPostsRef.current?.posts || [];
        const post = (currentPosts as Array<{ _id?: string; [key: string]: unknown }>).find((p) => p._id === reactionData?.postId);
        if (post && reactionData.postReactions) {
          const updatedPost = { ...post, reactions: reactionData.postReactions };
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
  );
};

export default Streams;

