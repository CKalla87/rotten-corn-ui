import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { find, cloneDeep } from 'lodash';
import ReactionWrapper from '@components/posts/modal-wrappers/reaction-wrapper/ReactionWrapper';
import Avatar from '@components/avatar/Avatar';
import CommentInputBox from '@components/posts/comments/comment-input/CommentInputBox';
import Reactions from '@components/posts/reactions/Reactions';
import { postService } from '@services/api/post/post.service';
import { chatService } from '@services/api/chat/chat.service';
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

const CommentsModal = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { commentsModalIsOpen, data } = useSelector((state: RootState) => state.modal);
  const { post: postFromRedux } = useSelector((state: RootState) => state.post);
  const { posts: allPosts } = useSelector((state: RootState) => state.allPosts);
  const { profile } = useSelector((state: RootState) => state.user);
  const [postComments, setPostComments] = useState<CommentData[]>([]);
  const [postData, setPostData] = useState<PostData | null>(null);
  const [showReactionsForComment, setShowReactionsForComment] = useState<string | null>(null);
  const reactionsRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const commentRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const commentsContainerRef = useRef<HTMLDivElement | null>(null);
  const lastAddedCommentId = useRef<string | null>(null);
  const savingReactionsRef = useRef<Set<string>>(new Set()); // Track comments currently saving reactions
  const lastLoadedPostIdRef = useRef<string | undefined>(undefined); // Track last postId we loaded comments for
  
  // Get post ID from modal data (set when opening) or from post Redux state
  const modalData = data as { postId?: string; post?: PostData } | null;
  const postIdFromModal = modalData?.postId;
  const postIdFromRedux = (postFromRedux as unknown as PostData)?._id || (postFromRedux as { id?: string })?.id;
  const postId = postIdFromModal || postIdFromRedux || undefined;
  
  // Use post from modal data if available, otherwise use Redux post, or find from allPosts
  let currentPost: PostData | null = (modalData?.post as PostData) || (postFromRedux as unknown as PostData | null) || null;
  
  // If we have postId but no post data, try to find it from allPosts
  if (!currentPost && postId && allPosts && Array.isArray(allPosts)) {
    currentPost = (allPosts as unknown as PostData[]).find((p: PostData) => p._id === postId || p.id === postId) || null;
  }

  const getPrivacy = (type?: string): React.ReactElement | null => {
    if (!type) return null;
    const privacy = find(privacyList, (data: PrivacyItem) => data.topText === type);
    return privacy?.icon || null;
  };

  const getPostComments = async () => {
    try {
      // Use postId from state (either from modal data or Redux post)
      const currentPostId = postId;
      if (!currentPostId) {
        setPostComments([]);
        return;
      }
      const response = await postService.getPostComments(currentPostId);
      
      // Handle different possible response structures
      let comments: CommentData[] = [];
      
      // Try response.data.comments first (most common)
      if (response.data?.comments && Array.isArray(response.data.comments)) {
        comments = response.data.comments;
      }
      // Try response.data.data.comments
      else if (response.data?.data?.comments && Array.isArray(response.data.data.comments)) {
        comments = response.data.data.comments;
      }
      // Try if response.data is directly an array
      else if (Array.isArray(response.data)) {
        comments = response.data;
      }
      // Try response.data.data as array
      else if (Array.isArray(response.data?.data)) {
        comments = response.data.data;
      }
      // Last resort: try to use response.data if it exists
      else if (response.data) {
        comments = Array.isArray(response.data) ? response.data : [];
      }
      
      // Process comments - reactions and gifUrl should now be included in API response from backend
      // Backend returns comments sorted by createdAt: 1 (oldest first, newest last)
      const processedComments = comments.map((comment) => {
        // Ensure reaction is an array (from backend)
        const reactionArray: CommentReaction[] = Array.isArray(comment.reaction) 
          ? comment.reaction 
          : [];
        
        // Preserve gifUrl if it exists
        const gifUrl = comment.gifUrl && typeof comment.gifUrl === 'string' ? comment.gifUrl : undefined;
        
        const processedComment = {
          ...comment,
          reaction: reactionArray,
          gifUrl: gifUrl
        };
        
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
      
      setPostComments(processedComments);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
      const errorMessage = axiosError?.response?.data?.message || 'Failed to load comments';
      // Only show notification if it's not a 404 (comments not found is okay)
      if (axiosError?.response?.status !== 404) {
        Utils.dispatchNotification(errorMessage, 'error', dispatch);
      }
      setPostComments([]);
    }
  };

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

  const getUserReaction = (comment: CommentData): string => {
    // First check userReaction field (backward compatibility)
    if (comment.userReaction && typeof comment.userReaction === 'string') {
      return comment.userReaction;
    }
    
    // Check reaction array (like chat messages) - find user's reaction
    if (comment.reaction && Array.isArray(comment.reaction) && profile?.username) {
      const userReaction = comment.reaction.find(
        (r: CommentReaction) => r.senderName === profile.username || r.username === profile.username
      );
      if (userReaction?.type) {
        return userReaction.type;
      }
    }
    
    // Check reactions array (alternative field name)
    if (comment.reactions && Array.isArray(comment.reactions) && profile?.username) {
      const userReaction = comment.reactions.find(
        (r: CommentReaction) => r.senderName === profile.username || r.username === profile.username
      );
      if (userReaction?.type) {
        return userReaction.type;
      }
    }
    
    return '';
  };

  const addCommentReaction = async (commentId: string, reaction: string) => {
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
    const commentBeforeUpdate = postComments.find((c) => c._id === commentId);
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
      
      const currentUserReaction = getUserReaction(commentBeforeUpdate);
      const isRemoving = currentUserReaction === reaction;
      
      // Optimistically update the comment in the list (like chat messages)
      const updatedComments = postComments.map((comment) => {
        if (comment._id === commentId) {
          const updatedComment = cloneDeep(comment);
          
          // Ensure reaction is an array (like chat messages)
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
              type: reaction
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
            updatedComment.userReaction = reaction; // For backward compatibility
          }
          
          return updatedComment;
        }
        return comment;
      });
      
      setPostComments(updatedComments);
      
      // Call API to save reaction (using chat message reaction endpoint - same as chat page)
      try {
        const reactionBody = {
          conversationId: postId, // Use postId as conversationId
          messageId: commentId, // Use commentId as messageId
          reaction: reaction,
          type: isRemoving ? 'remove' : 'add'
        };
        
        console.log('💾 Saving comment reaction:', reactionBody);
        
        // Use chat service endpoint (same as chat messages)
        const apiResponse = await chatService.updateMessageReaction(reactionBody);
        
        if (!apiResponse || !apiResponse.data) {
          throw new Error('Invalid API response');
        }
        
        console.log('✅ Comment reaction saved:', apiResponse.data);
        
        // Emit socket event for real-time updates
        socketService?.socket?.emit('comment reaction', {
          commentId,
          postId,
          reaction: isRemoving ? '' : reaction,
          username: profile?.username
        });
        
        // Verify the reaction was saved by checking the updated comment state
        // Don't reload all comments, just ensure our optimistic update matches reality
      } catch (apiError) {
        // Remove from saving set on error
        savingReactionsRef.current.delete(commentId);
        // If API call fails, revert optimistic update
        console.error('❌ Failed to save comment reaction:', apiError);
        const errorMessage = (apiError as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save reaction';
        Utils.dispatchNotification(errorMessage, 'error', dispatch);
        
        // Revert to the state before the optimistic update
        setPostComments((prev) => {
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
  };

  const toggleReactionsForComment = (commentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowReactionsForComment(showReactionsForComment === commentId ? null : commentId);
  };

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
  useEffect(() => {
    if (commentsModalIsOpen && currentPost) {
      setPostData(currentPost);
    } else {
      setPostData(null);
    }
  }, [commentsModalIsOpen, currentPost]);

  // Load comments when modal opens or post ID changes
  useEffect(() => {
    if (commentsModalIsOpen && postId) {
      // Only reload comments if postId changed (not just on modal open)
      // This prevents clearing optimistic updates when modal stays open
      if (lastLoadedPostIdRef.current !== postId) {
        lastLoadedPostIdRef.current = postId;
        getPostComments();
      }
    } else {
      setPostComments([]);
      lastLoadedPostIdRef.current = undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentsModalIsOpen, postId]);
  
  // Also listen for socket updates to refresh comments
  useEffect(() => {
    if (!commentsModalIsOpen || !postId) return;
    
    const socket = socketService?.socket;
    if (!socket) return;
    
    const handleCommentUpdate = (commentData: unknown) => {
      // Handle both 'comment' event (from backend) and 'update comment' event
      // Backend emits 'comment' with the comment object directly
      let actualComment: CommentData | undefined;
      let actualPostId: string | undefined;
      
      console.log('📡 Socket comment event received:', {
        commentData,
        currentPostId: postId,
        modalOpen: commentsModalIsOpen
      });
      
      // Check if it's the wrapped format (from 'update comment')
      if (commentData && typeof commentData === 'object' && 'postId' in commentData) {
        const wrapped = commentData as { postId?: string; comment?: CommentData; commentsCount?: number };
        if (wrapped.postId) {
          actualPostId = wrapped.postId;
          actualComment = wrapped.comment;
          if (actualComment?.gifUrl) {
            console.log('📡 Comment from socket (wrapped) has GIF:', actualComment.gifUrl);
          }
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
          if (actualComment.gifUrl) {
            console.log('📡 Comment from socket (direct) has GIF:', actualComment.gifUrl);
          }
        } else {
          // If no postId in comment, but we have a postId in state, assume it's for this post
          // This handles cases where backend doesn't include postId in the comment object
          if (postId) {
            actualComment = {
              ...directComment,
              gifUrl: directComment.gifUrl
            } as CommentData;
            actualPostId = postId; // Use current postId
            console.log('📡 Comment from socket has no postId, using current postId:', postId);
          }
        }
      }
      
      // Compare postIds - handle both string and ObjectId formats
      // Also allow comments without postId if we're in the comments modal (assume they're for this post)
      let postIdsMatch = false;
      
      if (actualPostId && postId) {
        // Try multiple comparison methods
        postIdsMatch = (
          actualPostId === postId || 
          String(actualPostId) === String(postId) ||
          actualPostId.toString() === postId.toString()
        );
      } else if (!actualPostId && postId && actualComment) {
        // If socket event has no postId but we're in a modal, assume it's for this post
        // This handles cases where backend doesn't include postId in socket event
        postIdsMatch = true;
        actualPostId = postId; // Set it for consistency
        console.log('📡 Socket comment has no postId, assuming it\'s for current post:', postId);
      }
      
      // Also check if comment object itself has postId field
      if (!postIdsMatch && actualComment && 'postId' in actualComment) {
        const commentPostId = (actualComment as { postId?: string | unknown }).postId;
        if (commentPostId && postId) {
          postIdsMatch = (
            commentPostId === postId ||
            String(commentPostId) === String(postId) ||
            commentPostId.toString() === postId.toString()
          );
          if (postIdsMatch) {
            actualPostId = String(commentPostId);
          }
        }
      }
      
      // Process comment if postIds match OR if we're in the modal and comment has no postId (assume it's for this post)
      // If we have a comment but postId doesn't match, log it for debugging
      if (actualComment && actualComment._id && !postIdsMatch) {
        console.log('⚠️ Socket comment postId mismatch:', {
          commentId: actualComment._id,
          actualPostId,
          currentPostId: postId,
          commentPostId: (actualComment as { postId?: string }).postId
        });
      }
      
      if (postIdsMatch && actualComment && actualComment._id) {
        console.log('📡 Processing socket comment:', {
          id: actualComment._id,
          hasGif: !!actualComment.gifUrl,
          gifUrl: actualComment.gifUrl?.substring(0, 50),
          username: actualComment.username,
          postIdMatch: postIdsMatch,
          actualPostId,
          currentPostId: postId
        });
        
        setPostComments((prev) => {
          // First check: does this comment ID already exist?
          const existsById = prev.some((c) => c._id === actualComment!._id);
          if (existsById) {
            console.log('⚠️ Comment already exists by ID from socket, skipping:', actualComment._id);
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
              console.log('✅ Replacing existing GIF comment (same GIF + user):', {
                oldId: prev[existingIndex]._id,
                newId: actualComment._id,
                gifUrl: actualComment.gifUrl,
                username: actualComment.username
              });
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
              console.log('⚠️ Duplicate text comment detected, skipping');
              return prev;
            }
          }
          
          console.log('✅ Adding new comment from socket:', actualComment._id, actualComment.gifUrl ? 'with GIF' : 'text');
          
          // Store ID for scrolling
          if (actualComment._id) {
            lastAddedCommentId.current = actualComment._id;
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
      }
    };
    
    // Listen to both socket events
    socket.on('update comment', handleCommentUpdate);
    socket.on('comment', handleCommentUpdate);
    
    return () => {
      socket.off('update comment', handleCommentUpdate);
      socket.off('comment', handleCommentUpdate);
    };
  }, [commentsModalIsOpen, postId]);

  // Scroll to newly added comment
  useEffect(() => {
    if (lastAddedCommentId.current) {
      const commentId = lastAddedCommentId.current;
      // Wait for DOM to update
      setTimeout(() => {
        const commentElement = commentRefs.current[commentId];
        if (commentElement && commentsContainerRef.current) {
          commentElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          // Reset the ref after scrolling
          lastAddedCommentId.current = null;
        }
      }, 100);
    }
  }, [postComments]);


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
              {postData?.gifUrl && (
                <div className="image-display-flex">
                  <img className="post-image" src={Utils.fixCloudinaryUrl(postData.gifUrl as string)} alt="" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                </div>
              )}
              {postData?.imgId && postData?.imgVersion && !postData?.gifUrl && (
                <div className="image-display-flex">
                  <img 
                    className="post-image" 
                    src={(() => {
                      let imgSrc = Utils.getImage(
                        postData.imgId as string, 
                        postData.imgVersion as string, 
                        postData.image as string
                      );
                      if (imgSrc) {
                        imgSrc = Utils.fixCloudinaryUrl(imgSrc);
                      }
                      return imgSrc;
                    })()} 
                    alt="" 
                    style={{ maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }}
                  />
                </div>
              )}
              {postData?.image && !postData?.imgId && !postData?.gifUrl && (
                <div className="image-display-flex">
                  <img 
                    className="post-image" 
                    src={Utils.fixCloudinaryUrl(postData.image as string)} 
                    alt=""
                    style={{ maxWidth: '100%', borderRadius: '8px' }}
                  />
                </div>
              )}
              {postData?.videoId && (
                <div className="image-display-flex">
                  <video 
                    width="100%" 
                    height="auto" 
                    controls 
                    src={Utils.getVideo(postData.videoId as string, postData.videoVersion as string)}
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
        <div className="modal-comments-container" ref={commentsContainerRef}>
          {!postId ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
              ⚠️ Error: Post ID is missing. Cannot load comments.
            </div>
          ) : postComments.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-8)' }}>
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <ul className="modal-comments-container-list">
              {postComments.map((commentData) => {
                const commentId = commentData?._id || '';
                const userReaction = getUserReaction(commentData);
                // Use reaction array (like chat) or reactions object
                const totalReactions = getTotalReactionsCount(commentData.reaction || commentData.reactions);
                const gifUrl = commentData?.gifUrl && typeof commentData.gifUrl === 'string' ? commentData.gifUrl : null;
                
                return (
                  <li 
                    className="modal-comments-container-list-item" 
                    key={commentId} 
                    data-testid="modal-list-item"
                    ref={(el) => {
                      if (commentId) {
                        commentRefs.current[commentId] = el;
                      }
                    }}
                  >
                    <div className="modal-comments-container-list-item-display">
                      <div className="user-img">
                        <Avatar
                          name={commentData?.username}
                          bgColor={commentData?.avatarColor}
                          textColor="#ffffff"
                          size={45}
                          avatarSrc={commentData?.profilePicture}
                        />
                      </div>
                      <div className="modal-comments-container-list-item-display-block">
                        <div className="comment-data">
                          <h1>{commentData?.username}</h1>
                          <p>{commentData?.comment}</p>
                          {gifUrl && (
                            <img src={gifUrl} alt="GIF" style={{ maxWidth: '200px', marginTop: '8px', borderRadius: '8px' }} />
                          )}
                        </div>
                        <div className="comment-reactions-section">
                          <div className="comment-reactions-wrapper" ref={(el) => { reactionsRefs.current[commentId] = el; }}>
                            <div 
                              className={`comment-reaction-button ${userReaction ? String(userReaction).toLowerCase() : ''}`}
                              onClick={(e) => toggleReactionsForComment(commentId, e)}
                            >
                              {userReaction ? (
                                <img 
                                  className="reaction-img" 
                                  src={reactionsMap[userReaction.toLowerCase()] || reactionsMap.like} 
                                  alt={userReaction} 
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
              })}
            </ul>
          )}
        </div>
        
        {/* Comment Input Box */}
        {postData && postId && (
          <div className="modal-comment-input-wrapper">
            <CommentInputBox 
              post={postData} 
              onCommentAdded={(comment: CommentData) => {
                // Add comment immediately (optimistic update) for both text and GIF comments
                console.log('📝 onCommentAdded called:', {
                  id: comment._id,
                  hasGif: !!comment.gifUrl,
                  gifUrl: comment.gifUrl?.substring(0, 50),
                  comment: comment.comment?.substring(0, 30),
                  username: comment.username
                });
                
                setPostComments((prev) => {
                  // Check by ID first
                  const existsById = prev.some((c) => c._id === comment._id);
                  if (existsById) {
                    console.log('⚠️ Comment already exists by ID, skipping optimistic update');
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
                      console.log('⚠️ Recent duplicate GIF comment in optimistic update, skipping');
                      return prev;
                    }
                  }
                  
                  // Store ID for scrolling
                  if (comment._id) {
                    lastAddedCommentId.current = comment._id;
                  }
                  
                  console.log('✅ Adding comment optimistically:', {
                    id: comment._id,
                    hasGif: !!comment.gifUrl,
                    gifUrl: comment.gifUrl?.substring(0, 50),
                    username: comment.username
                  });
                  
                  // Ensure gifUrl is preserved in the comment object
                  const commentWithGif = {
                    ...comment,
                    gifUrl: comment.gifUrl || undefined // Ensure gifUrl is explicitly set
                  };
                  
                  // Add comment and sort to maintain chronological order
                  const updated = [...prev, commentWithGif];
                  updated.sort((a, b) => {
                    const aTime = a.createdAt && (typeof a.createdAt === 'string' || a.createdAt instanceof Date)
                      ? new Date(a.createdAt).getTime() 
                      : Date.now();
                    const bTime = b.createdAt && (typeof b.createdAt === 'string' || b.createdAt instanceof Date)
                      ? new Date(b.createdAt).getTime() 
                      : Date.now();
                    return aTime - bTime; // Ascending: oldest first, newest last
                  });
                  
                  console.log('✅ Comments after optimistic update:', updated.length, 'comments');
                  return updated;
                });
              }}
            />
          </div>
        )}
      </div>
    </ReactionWrapper>
  );
};

export default CommentsModal;

