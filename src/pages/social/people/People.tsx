import { useState, useRef, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { uniqBy } from 'lodash';
import { FaCircle } from 'react-icons/fa';
import Avatar from '@components/avatar/Avatar';
import CardElementButtons from '@components/card-element/CardElementButtons';
import CardElementStats from '@components/card-element/CardElementStats';
import { userService } from '@services/api/user/user.service';
import { followerService } from '@services/api/followers/follower.service';
import { socketService } from '@services/socket/socket.service';
import { FollowersUtils } from '@services/utils/followers-utils.service';
import { ProfileUtils } from '@services/utils/profile-utils.service';
import { Utils } from '@services/utils/utils.service';
import useInfiniteScroll from '@hooks/useInfiniteScroll';
import useEffectOnce from '@hooks/useEffectOnce';
import type { RootState, AppDispatch } from '@redux/store';
import './People.scss';

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

const People = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profile } = useSelector((state: RootState) => state.user);
  const [users, setUsers] = useState<UserData[]>([]);
  const [following, setFollowing] = useState<UserData[]>([]);
  const [onlineUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const bottomLineRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const PAGE_SIZE = 12;

  const getAllUsers = useCallback(async (page?: number) => {
    try {
      const pageToUse = page !== undefined ? page : currentPage;
      const response = await userService.getAllUsers(pageToUse);
      if (response.data.users.length > 0) {
        setUsers((data) => {
          const result = [...data, ...response.data.users];
          const allUsers = uniqBy(result, '_id');
          return allUsers;
        });
      }
      setTotalUsersCount(response.data.totalUsers);
      setLoading(false);
    } catch (error: unknown) {
      setLoading(false);
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  }, [currentPage, dispatch]);

  function fetchData() {
    let pageNum = currentPage;
    pageNum += 1;
    if (currentPage <= Math.round(totalUsersCount / PAGE_SIZE)) {
      setCurrentPage(pageNum);
      getAllUsers(pageNum);
    }
  }

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
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  const getUserFollowing = useCallback(async () => {
    try {
      const response = await followerService.getUserFollowing();
      if (response.data.users && response.data.users.length > 0) {
        setFollowing((data) => {
          const result = [...data, ...response.data.users];
          const allUsers = uniqBy(result, '_id');
          return allUsers;
        });
      }
      setTotalUsersCount(response.data.totalUsers);
      setLoading(false);
    } catch (error: unknown) {
      setLoading(false);
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  }, [dispatch]);

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
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  useInfiniteScroll(bodyRef as React.RefObject<HTMLElement>, bottomLineRef as React.RefObject<HTMLElement>, fetchData);

  useEffectOnce(() => {
    getAllUsers();
    getUserFollowing();
  });

  useEffect(() => {
    if (users.length > 0 || following.length > 0) {
      FollowersUtils.socketIOFollowAndUnfollow(users, following, setFollowing, setUsers);
    }
    // Cleanup socket listeners on unmount
    return () => {
      if (socketService.socket) {
        socketService.socket.off('add follower');
        socketService.socket.off('remove follower');
      }
    };
  }, [following, users]);

  return (
    <div className="card-container" ref={bodyRef}>
      <div className="people">People</div>
      {users.length > 0 && (
        <div className="card-element">
          {users.map((data, index) => (
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
                isChecked={Utils.checkIfUserIsFollowed(following, data?._id, profile?._id)}
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
      {loading && !users.length && <div className="card-element" style={{ height: '350px' }}></div>}
      {!loading && !users.length && (
        <div className="empty-page" data-testid="empty-page">
          No user available
        </div>
      )}
      <div ref={bottomLineRef} style={{ marginBottom: '80px', height: '50px' }}></div>
    </div>
  );
};

export default People;
