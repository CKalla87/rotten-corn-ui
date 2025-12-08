import { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { cloneDeep, find, filter } from 'lodash';
import { FaRegCommentAlt } from 'react-icons/fa';
import Reactions from '@components/posts/reactions/Reactions';
import { postService } from '@services/api/post/post.service';
import { socketService } from '@services/socket/socket.service';
import { reactionsMap } from '@services/utils/static.data';
import { Utils } from '@services/utils/utils.service';
import { addReactions } from '@redux/reducers/post/userPostReactionSlice';
import { updatePostItem, clearPost } from '@redux/reducers/post/postSlice';
import useLocalStorage from '@hooks/useLocalStorage';
import type { RootState, AppDispatch } from '@redux/store';
import './CommentArea.scss';

interface PostReaction {
  type?: string;
  senderName?: string;
  username?: string;
  postId?: string;
  avatarColor?: string;
  profilePicture?: string;
  createdAt?: string;
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
  userId?: string;
  [key: string]: unknown;
}

interface CommentAreaProps {
  post: PostData;
}

const CommentArea = ({ post }: CommentAreaProps) => {
  const [userSelectedReaction, setUserSelectedReaction] = useState('');
  const selectedPostId = useLocalStorage<string>('selectedPostId', 'get') as string;
  const [setSelectedPostId] = useLocalStorage<string>('selectedPostId', 'set') as [(value: string) => void];
  const dispatch = useDispatch<AppDispatch>();
  const { reactions } = useSelector((state: RootState) => state.userPostReactions);
  const { profile } = useSelector((state: RootState) => state.user);

  const selectedUserReaction = useCallback(
    (postReactions: PostReaction[]) => {
      const userReaction = find(postReactions, (reaction) => reaction.postId === post._id && reaction.username === profile?.username);
      const result = userReaction ? Utils.firstLetterUpperCase(userReaction.type || '') : '';
      setUserSelectedReaction(result);
    },
    [post._id, profile?.username]
  );

  const toggleCommentInput = () => {
    if (!selectedPostId) {
      setSelectedPostId(post?._id || '');
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
    } else {
      removeSelectedPostId();
    }
  };

  const removeSelectedPostId = () => {
    if (selectedPostId === post?._id) {
      setSelectedPostId('');
      dispatch(clearPost());
    }
  };

  const updatePostReactions = (newReaction: string, hasResponse: number, previousReaction?: string) => {
    const updatedPost = cloneDeep(post);
    const reactionsObj = updatedPost.reactions as PostReactionsCount;
    
    if (!hasResponse) {
      if (reactionsObj && reactionsObj[newReaction] !== undefined) {
        reactionsObj[newReaction] = (reactionsObj[newReaction] || 0) + 1;
      }
    } else {
      if (previousReaction && reactionsObj && reactionsObj[previousReaction] !== undefined && reactionsObj[previousReaction]! > 0) {
        reactionsObj[previousReaction] = (reactionsObj[previousReaction] || 0) - 1;
      }
      if (previousReaction !== newReaction && reactionsObj && reactionsObj[newReaction] !== undefined) {
        reactionsObj[newReaction] = (reactionsObj[newReaction] || 0) + 1;
      }
    }
    return updatedPost;
  };

  const addNewReaction = (newReaction: string, hasResponse: number, previousReaction?: string): PostReaction[] => {
    const postReactions = filter(reactions, (reaction) => reaction?.postId !== post?._id);
    const newPostReaction: PostReaction = {
      avatarColor: profile?.avatarColor,
      createdAt: `${new Date()}`,
      postId: post?._id,
      profilePicture: profile?.profilePicture,
      username: profile?.username,
      type: newReaction
    };
    
    if (hasResponse && previousReaction !== newReaction) {
      postReactions.push(newPostReaction);
    } else if (!hasResponse) {
      postReactions.push(newPostReaction);
    }
    
    return postReactions;
  };

  const sendSocketIOReactions = (post: PostData, reaction: string, hasResponse: number, previousReaction?: string) => {
    const socketReactionData = {
      userTo: post.userId,
      postId: post._id,
      username: profile?.username,
      avatarColor: profile?.avatarColor,
      type: reaction,
      postReactions: post.reactions,
      profilePicture: profile?.profilePicture,
      previousReaction: hasResponse ? previousReaction : ''
    };
    socketService?.socket?.emit('reaction', socketReactionData);
  };

  const addReactionPost = async (reaction: string) => {
    try {
      const reactionResponse = await postService.getSinglePostReactionByUsername(post?._id || '', profile?.username || '');
      const hasResponse = Object.keys(reactionResponse.data.reactions || {}).length;
      const previousReaction = reactionResponse.data.reactions?.type;
      
      const updatedPost = updatePostReactions(reaction, hasResponse, previousReaction);
      const postReactions = addNewReaction(reaction, hasResponse, previousReaction);
      
      dispatch(addReactions(postReactions));
      
      sendSocketIOReactions(updatedPost, reaction, hasResponse, previousReaction);
      
      const reactionsData = {
        userTo: post?.userId,
        postId: post?._id,
        type: reaction,
        postReactions: post.reactions,
        profilePicture: profile?.profilePicture,
        previousReaction: Object.keys(reactionResponse.data.reactions || {}).length
          ? reactionResponse.data.reactions?.type
          : ''
      };
      
      if (!Object.keys(reactionResponse.data.reactions || {}).length) {
        await postService.addReaction(reactionsData);
      } else {
        reactionsData.previousReaction = reactionResponse.data.reactions?.type;
        if (reaction === reactionsData.previousReaction) {
          await postService.removeReaction(post?._id || '', reactionsData.previousReaction || '', post.reactions);
        } else {
          await postService.addReaction(reactionsData);
        }
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      selectedUserReaction(reactions);
    }, 0);
  }, [selectedUserReaction, reactions]);

  return (
    <div className="comment-area" data-testid="comment-area">
      <div className="like-icon reactions">
        <div className="likes-block" onClick={() => addReactionPost('like')}>
          <div className={`${userSelectedReaction ? userSelectedReaction.toLowerCase() : 'like'} likes-block-icons reaction-icon`}>
            {userSelectedReaction && (
              <div className={`reaction-display ${userSelectedReaction.toLowerCase()}`} data-testid="selected-reaction">
                <img className="reaction-img" src={reactionsMap[userSelectedReaction.toLowerCase()] || reactionsMap.like} alt="" />
                <span>{userSelectedReaction}</span>
              </div>
            )}
            {!userSelectedReaction && (
              <div className="reaction-display" data-testid="default-reaction">
                <img className="reaction-img" src={reactionsMap.like} alt="" />
                <span>Like</span>
              </div>
            )}
          </div>
          <div className="reactions-container app-reactions">
            <Reactions handleClick={addReactionPost} />
          </div>
        </div>
      </div>
      <div className="comment-block" onClick={toggleCommentInput}>
        <span className="comments-text">
          <FaRegCommentAlt className="comment-alt" />
          <span>Comments</span>
        </span>
      </div>
    </div>
  );
};

export default CommentArea;

