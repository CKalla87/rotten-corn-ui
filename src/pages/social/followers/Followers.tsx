import { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import Avatar from '@components/avatar/Avatar';
import CardElementButtons from '@components/card-element/CardElementButtons';
import CardElementStats from '@components/card-element/CardElementStats';
import { followerService } from '@services/api/followers/follower.service';
import { socketService } from '@services/socket/socket.service';
import { FollowersUtils } from '@services/utils/followers-utils.service';
import { ProfileUtils } from '@services/utils/profile-utils.service';
import { Utils } from '@services/utils/utils.service';
import useEffectOnce from '@hooks/useEffectOnce';
import type { RootState, AppDispatch } from '@redux/store';
import './Followers.scss';

interface UserData {
  _id?: string;
  username?: string;
  avatarColor?: string;
  profilePicture?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  blocked?: string[];
  [key: string]: unknown;
}

const Followers = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profile, token } = useSelector((state: RootState) => state.user);
  const [followers, setFollowers] = useState<UserData[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();

  const getUserFollowers = useCallback(async () => {
    try {
      const response = await followerService.getUserFollowers(profile?._id || '');
      if (response.data.followers && response.data.followers.length > 0) {
        setFollowers(response.data.followers);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      const axiosError = error as AxiosError<{ message?: string }>;
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  }, [profile, dispatch]);

  const blockUser = async (user: UserData) => {
    try {
      socketService?.socket?.emit('block user', { blockedUser: user._id, blockedBy: profile?._id });
      await FollowersUtils.blockUser(user, dispatch);
      // Update local state immediately
      setBlockedUsers((prev) => [...prev, user._id || '']);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  const unblockUser = async (user: UserData) => {
    try {
      socketService?.socket?.emit('unblock user', { blockedUser: user._id, blockedBy: profile?._id });
      await FollowersUtils.unblockUser(user, dispatch);
      // Update local state immediately
      setBlockedUsers((prev) => Utils.removeUserFromList(prev, user._id || ''));
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  useEffectOnce(() => {
    getUserFollowers();
    setBlockedUsers((profile?.blocked as string[]) || []);
  });

  useEffect(() => {
    if (profile && token) {
      FollowersUtils.socketIOBlockAndUnblock(profile || {}, token || '', setBlockedUsers, dispatch);
    }
    // Cleanup socket listeners on unmount
    return () => {
      if (socketService.socket) {
        socketService.socket.off('blocked user id');
        socketService.socket.off('unblocked user id');
      }
    };
  }, [profile, token, dispatch]);

  // Handle window resize for responsive avatar size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="card-container">
      <div className="followers">Followers</div>
      {followers.length > 0 && (
        <div className="card-element">
          {followers.map((data, index) => (
            <div className="card-element-item" key={index} data-testid="card-element-item">
              <div className="card-element-header">
                <div className="card-element-header-bg"></div>
                <div 
                  onClick={() => ProfileUtils.navigateToProfile(data, navigate)}
                  style={{ cursor: 'pointer' }}
                >
                  <Avatar
                    name={data?.username}
                    bgColor={data?.avatarColor}
                    textColor="#ffffff"
                    size={isMobile ? 80 : 120}
                    avatarSrc={data?.profilePicture}
                  />
                </div>
              </div>
              <div className="card-element-body">
                <span 
                  className="card-element-body-name"
                  onClick={() => ProfileUtils.navigateToProfile(data, navigate)}
                  style={{ cursor: 'pointer' }}
                >
                  {data?.username}
                </span>
              </div>
              <CardElementStats
                followersCount={data?.followersCount}
                followingCount={data?.followingCount}
                postsCount={data?.postsCount}
              />
              <CardElementButtons
                isChecked={Utils.checkIfUserIsBlocked(blockedUsers, data?._id || '')}
                btnTextOne="Block"
                btnTextTwo="Unblock"
                onClickBtnOne={() => blockUser(data)}
                onClickBtnTwo={() => unblockUser(data)}
                onNavigateToProfile={() => ProfileUtils.navigateToProfile(data, navigate)}
                userId={undefined}
                username={undefined}
              />
            </div>
          ))}
        </div>
      )}
      {loading && !followers.length && <div className="card-element" style={{ height: '350px' }}></div>}
      {!loading && !followers.length && (
        <div className="empty-page" data-testid="empty-page">
          You have no followers
        </div>
      )}
    </div>
  );
};

export default Followers;
