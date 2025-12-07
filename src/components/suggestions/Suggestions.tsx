import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { filter } from 'lodash';
import Avatar from '@components/avatar/Avatar';
import Button from '@components/button/Button';
import { FollowersUtils } from '@services/utils/followers-utils.service';
import { Utils } from '@services/utils/utils.service';
import { getUserSuggestions } from '@redux/api/suggestion';
import { addToSuggestions } from '@redux/reducers/suggestions/suggestionsSlice';
import type { RootState, AppDispatch } from '@redux/store';
import type { UserProfile } from '@redux/reducers/user/userSlice';
import './Suggestions.scss';

const Suggestions = () => {
  const { suggestions } = useSelector((state: RootState) => state);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const followUser = async (user: UserProfile) => {
    try {
      await FollowersUtils.followUser(user, dispatch);
      const result = filter(users, (data) => data?._id !== user?._id);
      setUsers(result);
      dispatch(addToSuggestions({ users: result, isLoading: false }));
      dispatch(getUserSuggestions());
    } catch (error: any) {
      Utils.dispatchNotification(error?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  useEffect(() => {
    setUsers(suggestions?.users || []);
  }, [suggestions]);

  return (
    <div className="suggestions-list-container" data-testid="suggestions-container">
      <div className="suggestions-header">
        <div className="title-text">Suggestions</div>
      </div>
      <hr />
      <div className="suggestions-container">
        <div className="suggestions">
          {users?.map((user) => (
            <div data-testid="suggestions-item" className="suggestions-item" key={Utils.generateString(10)}>
              <Avatar
                name={user?.username}
                bgColor={user?.avatarColor}
                textColor="#ffffff"
                size={40}
                avatarSrc={user?.profilePicture as string | undefined}
              />
              <div className="title-text">{user?.username}</div>
              <div className="add-icon">
                <Button label="Follow" className="button follow" disabled={false} handleClick={() => followUser(user)} />
              </div>
            </div>
          ))}
        </div>
        {users.length > 8 && (
          <div className="view-more" onClick={() => navigate('/app/social/people')}>
            View More
          </div>
        )}
      </div>
    </div>
  );
};

export default Suggestions;

