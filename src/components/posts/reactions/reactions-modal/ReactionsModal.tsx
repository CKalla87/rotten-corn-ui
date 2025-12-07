import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { orderBy, some, filter } from 'lodash';
import ReactionWrapper from '@components/posts/modal-wrappers/reaction-wrapper/ReactionWrapper';
import ReactionList from '@components/posts/reactions/reactions-modal/reaction-list/ReactionList';
import { postService } from '@services/api/post/post.service';
import { reactionsMap, reactionsColor } from '@services/utils/static.data';
import { Utils } from '@services/utils/utils.service';
import { closeModal, toggleReactionsModal } from '@redux/reducers/modal/modalSlice';
import { clearPost } from '@redux/reducers/post/postSlice';
import useEffectOnce from '@hooks/useEffectOnce';
import type { RootState, AppDispatch } from '@redux/store';
import './ReactionsModal.scss';

interface ReactionItem {
  type: string;
  value: number;
}

interface PostReaction {
  username?: string;
  avatarColor?: string;
  profilePicture?: string;
  type?: string;
  createdAt?: string;
  [key: string]: unknown;
}

const ReactionsModal = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { reactionModalIsOpen } = useSelector((state: RootState) => state.modal);
  const { _id, reactions } = useSelector((state: RootState) => state.post);
  const [activeViewAllTab, setActiveViewAllTab] = useState(true);
  const [formattedReactions, setFormattedReactions] = useState<ReactionItem[]>([]);
  const [reactionType, setReactionType] = useState('');
  const [reactionColor, setReactionColor] = useState('');
  const [postReactions, setPostReactions] = useState<PostReaction[]>([]);
  const [reactionsOfPost, setReactionsOfPost] = useState<PostReaction[]>([]);

  const getPostReactions = async () => {
    try {
      const response = await postService.getPostReactions(_id || '');
      const orderedPosts = orderBy(response.data?.reactions, ['createdAt'], ['desc']);
      setPostReactions(orderedPosts);
      setReactionsOfPost(orderedPosts);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  const closeReactionsModal = () => {
    dispatch(closeModal());
    dispatch(clearPost());
    dispatch(toggleReactionsModal(false));
  };

  const viewAll = () => {
    setActiveViewAllTab(true);
    setReactionType('');
    setPostReactions(reactionsOfPost);
  };

  const reactionList = (type: string) => {
    setActiveViewAllTab(false);
    setReactionType(type);
    const exist = some(reactionsOfPost, (reaction) => reaction.type === type);
    const filteredReactions = exist ? filter(reactionsOfPost, (reaction) => reaction.type === type) : [];
    setPostReactions(filteredReactions);
    setReactionColor(reactionsColor[type] || '');
  };

  useEffectOnce(() => {
    getPostReactions();
    const reactionsObj = Array.isArray(reactions) 
      ? {} 
      : (reactions as Record<string, number> || {});
    setFormattedReactions(Utils.formattedReactions(reactionsObj));
  });

  if (!reactionModalIsOpen) {
    return null;
  }

  return (
    <ReactionWrapper closeModal={closeReactionsModal}>
      <div className="modal-reactions-header-tabs">
        <ul className="modal-reactions-header-tabs-list">
          <li className={`${activeViewAllTab ? 'activeViewAllTab' : 'all'} title`} onClick={viewAll}>
            All
          </li>
          {formattedReactions.map((reaction, index) => (
            <li
              key={index}
              className={`${reaction.type === reactionType ? 'activeTab' : ''}`}
              style={{ color: reaction.type === reactionType ? reactionColor : '' }}
              onClick={() => reactionList(reaction.type)}
            >
              <img src={reactionsMap[reaction.type]} alt="" />
              <span>{Utils.shortenLargeNumbers(reaction.value)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="modal-reactions-list">
        <ReactionList postReactions={postReactions} />
      </div>
    </ReactionWrapper>
  );
};

export default ReactionsModal;

