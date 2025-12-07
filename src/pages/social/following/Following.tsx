import { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaCircle } from 'react-icons/fa';
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
import './Following.scss';

interface UserData {
  _id?: string;
  username?: string;
  avatarColor?: string;
  profilePicture?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  [key: string]: unknown;
}

const Following = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profile } = useSelector((state: RootState) => state.user);
  const [following, setFollowing] = useState<UserData[]>([]);
  const [followers, setFollowers] = useState<UserData[]>([]);
  const [onlineUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getUserFollowing = useCallback(async () => {
    try {
      const response = await followerService.getUserFollowing();
      setFollowing(response.data.following);
      setFollowers(response.data.followers || []);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      Utils.dispatchNotification(error?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  }, [dispatch]);

  const followUser = async (user: UserData) => {
    try {
      socketService?.socket?.emit('add follower', user);
      await FollowersUtils.followUser(user, dispatch);
      // Update local state immediately - add to following list
      setFollowing((prev) => {
        const exists = prev.find((u) => u._id === user._id);
        if (!exists) {
          return [...prev, user];
        }
        return prev;
      });
      // Update followers list if needed
      setFollowers((prev) => {
        const exists = prev.find((u) => u._id === user._id);
        if (!exists) {
          return [...prev, user];
        }
        return prev;
      });
    } catch (error: any) {
      Utils.dispatchNotification(error?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  const unFollowUser = async (user: UserData) => {
    try {
      const userData = { ...user };
      if (userData.followersCount !== undefined) {
        userData.followersCount -= 1;
      }
      socketService?.socket?.emit('unfollow user', userData);
      await FollowersUtils.unFollowUser(user, profile || {}, dispatch);
      // Update local state immediately - remove from following list
      setFollowing((prev) => prev.filter((u) => u._id !== user._id));
    } catch (error: any) {
      Utils.dispatchNotification(error?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  useEffectOnce(() => {
    getUserFollowing();
  });

  useEffect(() => {
    if (following.length > 0) {
      FollowersUtils.socketIORemoveFollowing(following, setFollowing);
    }
    // Cleanup socket listeners on unmount
    return () => {
      if (socketService.socket) {
        socketService.socket.off('remove follower');
      }
    };
  }, [following]);

  return (
    <div className="card-container">
      <div className="following">Following</div>
      {following.length > 0 && (
        <div className="card-element">
          {following.map((data, index) => (
            <div className="card-element-item" key={index} data-testid="card-element-item">
              {Utils.checkIfUserIsOnline(data?.username || '', onlineUsers) && (
                <div className="card-element-item-indicator">
                  <FaCircle className="online-indicator" />
                </div>
              )}
              <div className="card-element-header">
                <div className="card-element-header-bg"></div>
                <Avatar
                  name={data?.username}
                  bgColor={data?.avatarColor}
                  textColor="#ffffff"
                  size={120}
                  avatarSrc={data?.profilePicture}
                />
                <div className="card-element-header-text">
                  <span className="card-element-header-name">{data?.username}</span>
                </div>
              </div>
              <CardElementStats
                followersCount={data?.followersCount}
                followingCount={data?.followingCount}
                postsCount={data?.postsCount}
              />
              <CardElementButtons
                isChecked={true}
                btnTextOne="Follow"
                btnTextTwo="Unfollow"
                onClickBtnOne={() => followUser(data)}
                onClickBtnTwo={() => unFollowUser(data)}
                onNavigateToProfile={() => ProfileUtils.navigateToProfile(data, navigate)}
              />
            </div>
          ))}
        </div>
      )}
      {loading && !following.length && <div className="card-element" style={{ height: '350px' }}></div>}
      {!loading && !following.length && (
        <div className="empty-page" data-testid="empty-page">
          You have no following
        </div>
      )}
    </div>
  );
};

export default Following;
