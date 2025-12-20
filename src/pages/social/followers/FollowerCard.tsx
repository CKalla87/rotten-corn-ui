import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { FaUserPlus } from 'react-icons/fa';
import Avatar from '@components/avatar/Avatar';
import Button from '@components/button/Button';
import { followerService } from '@services/api/followers/follower.service';
import { userService } from '@services/api/user/user.service';
import { socketService } from '@services/socket/socket.service';
import { FollowersUtils } from '@services/utils/followers-utils.service';
import { ProfileUtils } from '@services/utils/profile-utils.service';
import { Utils } from '@services/utils/utils.service';
import useEffectOnce from '@hooks/useEffectOnce';
import { useEffect, useCallback } from 'react';
import type { RootState, AppDispatch } from '@redux/store';
import './Followers.scss';

interface UserData {
  _id?: string;
  username?: string;
  avatarColor?: string;
  profilePicture?: string;
  followingCount?: number;
  blocked?: string[];
  [key: string]: unknown;
}

interface FollowerCardProps {
  userData?: UserData;
}

const FollowerCard = ({ userData }: FollowerCardProps) => {
  const [followers, setFollowers] = useState<UserData[]>([]);
  // Use userData prop if available, otherwise use state
  const [internalUser, setInternalUser] = useState<UserData | undefined>(undefined);
  const user = userData || internalUser;
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();
  const { username } = useParams<{ username: string }>();
  const { profile, token } = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();

  const getUserFollowers = useCallback(async (userId: string) => {
    try {
      if (!userId) {
        setLoading(false);
        return;
      }
      const response = await followerService.getUserFollowers(userId);
      setFollowers(response.data.followers);
      setLoading(false);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
      setLoading(false);
    }
  }, [dispatch]);

  const getUserProfileByUsername = async () => {
    try {
      // If we already have userData prop, don't fetch
      if (userData && userData._id && userData.username) {
        return;
      }
      // Otherwise, fetch from API using URL params
      const userId = searchParams.get('id') || '';
      const userUId = searchParams.get('uId') || '';
      const usernameToUse = username || '';
      if (!usernameToUse) {
        return;
      }
      const response = await userService.getUserProfileByUsername(
        usernameToUse,
        userId,
        userUId
      );
      setInternalUser(response.data.user);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  const blockUser = async (userInfo: UserData) => {
    try {
      socketService?.socket?.emit('block user', { blockedUser: userInfo._id, blockedBy: user?._id });
      await FollowersUtils.blockUser(userInfo, dispatch);
      // Update local state immediately (only if we have internal user state)
      if (internalUser) {
        const updatedBlocked = [...((internalUser.blocked as string[]) || []), userInfo._id || ''];
        setInternalUser((prevUser) => ({ ...prevUser, blocked: updatedBlocked } as UserData));
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  const unblockUser = async (userInfo: UserData) => {
    try {
      socketService?.socket?.emit('unblock user', { blockedUser: userInfo._id, blockedBy: user?._id });
      await FollowersUtils.unblockUser(userInfo, dispatch);
      // Update local state immediately (only if we have internal user state)
      if (internalUser) {
        const updatedBlocked = Utils.removeUserFromList((internalUser.blocked as string[]) || [], userInfo._id || '');
        setInternalUser((prevUser) => ({ ...prevUser, blocked: updatedBlocked } as UserData));
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  useEffectOnce(() => {
    getUserProfileByUsername();
    // Fetch followers after getting user profile
    const fetchFollowers = async () => {
      const userId = userData?._id || searchParams.get('id') || '';
      if (userId) {
        await getUserFollowers(userId);
      }
    };
    // Use setTimeout to avoid calling setState synchronously
    setTimeout(() => {
      void fetchFollowers();
    }, 0);
  });

  // Fetch followers when user/userData becomes available (for when userData prop changes)
  useEffect(() => {
    const userId = user?._id;
    if (userId) {
      // Use setTimeout to avoid calling setState synchronously in effect
      setTimeout(() => {
        void getUserFollowers(userId);
      }, 0);
    }
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user && token) {
      FollowersUtils.socketIOBlockAndUnblockCard(user, token, (blocked: string[]) => {
        // Only update internal user state if we have it
        if (internalUser) {
          setInternalUser((prevUser) => ({ ...prevUser, blocked } as UserData));
        }
      }, dispatch);
    }
    // Cleanup socket listeners on unmount
    return () => {
      if (socketService.socket) {
        socketService.socket.off('blocked user id');
        socketService.socket.off('unblocked user id');
      }
    };
  }, [user, token, dispatch, internalUser]);

  return (
    <div data-testid="followers-card">
      {followers.length > 0 && (
        <div className="follower-card-container">
          {followers.map((data) => (
            <div className="follower-card-container-elements" key={data?._id} data-testid="card-element-item">
              <div className="follower-card-container-elements-content">
                <div 
                  className="card-avatar"
                  onClick={() => ProfileUtils.navigateToProfile(data, navigate)}
                  style={{ cursor: 'pointer' }}
                >
                  <Avatar
                    name={data?.username}
                    bgColor={data?.avatarColor}
                    textColor="#ffffff"
                    size={60}
                    avatarSrc={data?.profilePicture}
                  />
                </div>
                <div className="card-user">
                  <span 
                    className="name"
                    onClick={() => ProfileUtils.navigateToProfile(data, navigate)}
                    style={{ cursor: 'pointer' }}
                  >
                    {data?.username}
                  </span>
                  <p className="count">
                    <FaUserPlus className="heart" />{' '}
                    <span data-testid="count">{Utils.shortenLargeNumbers(data?.followingCount)}</span>
                  </p>
                </div>
                {username === profile?.username && (
                  <div className="card-following-button" data-testid="card-following-button">
                    {!Utils.checkIfUserIsBlocked((user?.blocked as string[]) || [], data?._id || '') && (
                      <Button
                        label="Block"
                        className="following-button"
                        disabled={false}
                        handleClick={() => blockUser(data)}
                      />
                    )}
                    {Utils.checkIfUserIsBlocked((user?.blocked as string[]) || [], data?._id || '') && (
                      <Button
                        label="Unblock"
                        className="following-button isUserFollowed"
                        disabled={false}
                        handleClick={() => unblockUser(data)}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && !followers.length && (
        <div className="empty-page" data-testid="empty-page">
          There are no followers to display
        </div>
      )}
    </div>
  );
};

export default FollowerCard;
