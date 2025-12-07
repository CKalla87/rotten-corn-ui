import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ReactionWrapper from '@components/posts/modal-wrappers/reaction-wrapper/ReactionWrapper';
import Avatar from '@components/avatar/Avatar';
import { postService } from '@services/api/post/post.service';
import { Utils } from '@services/utils/utils.service';
import { closeModal, toggleCommentsModal } from '@redux/reducers/modal/modalSlice';
import { clearPost } from '@redux/reducers/post/postSlice';
import useEffectOnce from '@hooks/useEffectOnce';
import type { RootState, AppDispatch } from '@redux/store';
import './CommentsModal.scss';

interface CommentData {
  _id?: string;
  username?: string;
  avatarColor?: string;
  profilePicture?: string;
  comment?: string;
  [key: string]: unknown;
}

const CommentsModal = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { commentsModalIsOpen } = useSelector((state: RootState) => state.modal);
  const { post } = useSelector((state: RootState) => state.post);
  const [postComments, setPostComments] = useState<CommentData[]>([]);

  const getPostComments = async () => {
    try {
      const postData = post as { _id?: string } | null;
      const response = await postService.getPostComments(postData?._id || '');
      setPostComments(response.data?.comments || []);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  const closeCommentsModal = () => {
    dispatch(closeModal());
    dispatch(clearPost());
    dispatch(toggleCommentsModal(false));
  };

  useEffectOnce(() => {
    getPostComments();
  });

  if (!commentsModalIsOpen) {
    return null;
  }

  return (
    <ReactionWrapper closeModal={closeCommentsModal}>
      <div className="modal-comments-header">
        <h2>Comments</h2>
      </div>
      <div className="modal-comments-container">
        <ul className="modal-comments-container-list">
          {postComments.map((data) => (
            <li className="modal-comments-container-list-item" key={data?._id} data-testid="modal-list-item">
              <div className="modal-comments-container-list-item-display">
                <div className="user-img">
                  <Avatar
                    name={data?.username}
                    bgColor={data?.avatarColor}
                    textColor="#ffffff"
                    size={45}
                    avatarSrc={data?.profilePicture}
                  />
                </div>
                <div className="modal-comments-container-list-item-display-block">
                  <div className="comment-data">
                    <h1>{data?.username}</h1>
                    <p>{data?.comment}</p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </ReactionWrapper>
  );
};

export default CommentsModal;

