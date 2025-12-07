import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { cloneDeep } from 'lodash';
import Input from '@components/input/Input';
import { postService } from '@services/api/post/post.service';
import { socketService } from '@services/socket/socket.service';
import { Utils } from '@services/utils/utils.service';
import type { RootState, AppDispatch } from '@redux/store';
import './CommentInputBox.scss';

interface PostData {
  _id?: string;
  userId?: string;
  commentsCount?: number;
  [key: string]: unknown;
}

interface CommentInputBoxProps {
  post: PostData;
}

const CommentInputBox = ({ post }: CommentInputBoxProps) => {
  const { profile } = useSelector((state: RootState) => state.user);
  const [comment, setComment] = useState('');
  const commentInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch<AppDispatch>();

  const submitComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      let updatedPost = cloneDeep(post);
      updatedPost.commentsCount = (updatedPost.commentsCount || 0) + 1;
      const commentBody = {
        userTo: post?.userId,
        postId: post?._id,
        comment: comment.trim(),
        commentsCount: updatedPost.commentsCount,
        profilePicture: profile?.profilePicture
      };
      socketService?.socket?.emit('comment', commentBody);
      await postService.addComment(commentBody);
      setComment('');
    } catch (error: any) {
      Utils.dispatchNotification(error?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  useEffect(() => {
    if (commentInputRef?.current) {
      commentInputRef.current.focus();
    }
  }, []);

  return (
    <div className="comment-container" data-testid="comment-input">
      <form className="comment-form" onSubmit={submitComment}>
        <Input
          ref={commentInputRef}
          name="comment"
          type="text"
          value={comment}
          labelText=""
          className="comment-input"
          placeholder="Write a comment..."
          handleChange={(e) => setComment(e.target.value)}
        />
      </form>
    </div>
  );
};

export default CommentInputBox;


