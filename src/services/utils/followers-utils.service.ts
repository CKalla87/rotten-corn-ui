import { cloneDeep, find, filter, findIndex } from 'lodash';
import { followerService } from '@services/api/followers/follower.service';
import { socketService } from '@services/socket/socket.service';
import { Utils } from '@services/utils/utils.service';
import { addUser } from '@redux/reducers/user/userSlice';
import { addToSuggestions } from '@redux/reducers/suggestions/suggestionsSlice';
import type { AppDispatch } from '@redux/store';

interface UserData {
  _id?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  blocked?: string[];
  blockedBy?: string[];
  [key: string]: unknown;
}

interface FollowerData {
  _id?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  [key: string]: unknown;
}

interface BlockData {
  blockedBy?: string;
  blockedUser?: string;
  [key: string]: unknown;
}

export class FollowersUtils {
  static async followUser(user: UserData, dispatch: AppDispatch): Promise<void> {
    try {
      const response = await followerService.followUser(user?._id || '');
      Utils.dispatchNotification(response.data.message, 'success', dispatch);
    } catch (error: any) {
      Utils.dispatchNotification(error?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  }

  static async unFollowUser(user: UserData, profile: UserData, dispatch: AppDispatch): Promise<void> {
    try {
      const response = await followerService.unFollowUser(user?._id || '', profile?._id || '');
      Utils.dispatchNotification(response.data.message, 'success', dispatch);
    } catch (error: any) {
      Utils.dispatchNotification(error?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  }

  static async blockUser(user: UserData, dispatch: AppDispatch): Promise<void> {
    try {
      const response = await followerService.blockUser(user?._id || '');
      Utils.dispatchNotification(response.data.message, 'success', dispatch);
    } catch (error: any) {
      Utils.dispatchNotification(error?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  }

  static async unblockUser(user: UserData, dispatch: AppDispatch): Promise<void> {
    try {
      const response = await followerService.unblockUser(user?._id || '');
      Utils.dispatchNotification(response.data.message, 'success', dispatch);
    } catch (error: any) {
      Utils.dispatchNotification(error?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  }

  static socketIOFollowAndUnfollow(
    users: UserData[],
    followers: FollowerData[],
    setFollowers: (followers: FollowerData[]) => void,
    setUsers: (users: UserData[]) => void
  ): void {
    socketService?.socket?.on('add follower', (data: FollowerData) => {
      const userData = find(users, (user) => user._id === data?._id);
      if (userData) {
        const updatedFollowers = [...followers, data];
        setFollowers(updatedFollowers);
        FollowersUtils.updateSingleUser(users, userData, data, setUsers);
      }
    });

    socketService?.socket?.on('remove follower', (data: FollowerData) => {
      const userData = find(users, (user) => user._id === data?._id);
      if (userData) {
        const updatedFollowers = filter(followers, (follower) => follower._id !== data?._id);
        setFollowers(updatedFollowers);
        FollowersUtils.updateSingleUser(users, userData, data, setUsers);
      }
    });
  }

  static socketIOFollowUsersSuggestions(
    users: UserData[],
    dispatch: AppDispatch
  ): void {
    socketService?.socket?.on('add follower', (data: FollowerData) => {
      let updatedUsers = cloneDeep(users);
      const userIndex = findIndex(updatedUsers, (user) => user._id === data?._id);
      if (userIndex > -1) {
        updatedUsers.splice(userIndex, 1);
        dispatch(addToSuggestions({ users: updatedUsers as any[], isLoading: false }));
      }
    });
  }

  static socketIORemoveFollowing(
    following: UserData[],
    setFollowing: (following: UserData[]) => void
  ): void {
    socketService?.socket?.on('remove follower', (data: FollowerData) => {
      const updatedFollowing = filter(following, (user) => user._id !== data?._id);
      setFollowing(updatedFollowing);
    });
  }

  static socketIOBlockAndUnblock(
    profile: UserData,
    token: string,
    setBlockedUsers: (blocked: string[]) => void,
    dispatch: AppDispatch
  ): void {
    socketService?.socket?.on('blocked user id', (data: BlockData) => {
      const user = FollowersUtils.addBlockedUser(profile, data);
      setBlockedUsers(user?.blocked || []);
      dispatch(addUser({ token, profile: user as any }));
    });

    socketService?.socket?.on('unblocked user id', (data: BlockData) => {
      const user = FollowersUtils.removeBlockedUser(profile, data);
      setBlockedUsers(user?.blocked || []);
      dispatch(addUser({ token, profile: user as any }));
    });
  }

  static socketIOBlockAndUnblockCard(
    profile: UserData,
    token: string,
    setBlockedUsers: (blocked: string[]) => void,
    dispatch: AppDispatch
  ): void {
    socketService?.socket?.on('blocked user id', (data: BlockData) => {
      const user = FollowersUtils.addBlockedUser(profile, data);
      setBlockedUsers(user?.blocked || []);
      dispatch(addUser({ token, profile: user as any }));
    });

    socketService?.socket?.on('unblocked user id', (data: BlockData) => {
      const user = FollowersUtils.removeBlockedUser(profile, data);
      setBlockedUsers(user?.blocked || []);
      dispatch(addUser({ token, profile: user as any }));
    });
  }

  static addBlockedUser(user: UserData, data: BlockData): UserData {
    user = cloneDeep(user);
    if (user?._id === data.blockedBy) {
      if (!user.blocked) {
        user.blocked = [];
      }
      user.blocked.push(data.blockedUser || '');
    }
    if (user?._id === data.blockedUser) {
      if (!user.blockedBy) {
        user.blockedBy = [];
      }
      user.blockedBy.push(data.blockedBy || '');
    }
    return user;
  }

  static removeBlockedUser(profile: UserData, data: BlockData): UserData {
    profile = cloneDeep(profile);
    if (profile?._id === data.blockedBy) {
      profile.blocked = [...Utils.removeUserFromList(profile.blocked || [], data.blockedUser || '')];
    }
    if (profile?._id === data.blockedUser) {
      profile.blockedBy = [...Utils.removeUserFromList(profile.blockedBy || [], data.blockedBy || '')];
    }
    return profile;
  }

  static updateSingleUser(
    users: UserData[],
    userData: UserData,
    followerData: FollowerData,
    setUsers: (users: UserData[]) => void
  ): void {
    let updatedUsers = cloneDeep(users);
    userData.followersCount = followerData.followersCount;
    userData.followingCount = followerData.followingCount;
    userData.postsCount = followerData.postsCount;
    const index = findIndex(updatedUsers, ['_id', userData?._id]);
    if (index > -1) {
      updatedUsers.splice(index, 1, userData);
      setUsers(updatedUsers);
    }
  }
}

