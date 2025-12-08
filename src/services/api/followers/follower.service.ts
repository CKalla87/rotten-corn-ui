import axios from '@services/axios';

class FollowerService {
  async followUser(followerId: string) {
    const response = await axios.put(`/user/follow/${followerId}`);
    return response;
  }

  async unFollowUser(userId: string, followerId: string) {
    const response = await axios.put(`/user/unfollow/${followerId}/${userId}`);
    return response;
  }

  async blockUser(userId: string) {
    const response = await axios.put(`/user/block/${userId}`);
    return response;
  }

  async unblockUser(userId: string) {
    const response = await axios.put(`/user/unblock/${userId}`);
    return response;
  }

  async getUserFollowers(userId: string) {
    const response = await axios.get(`/user/followers/${userId}`);
    return response;
  }

  async getUserFollowing() {
    const response = await axios.get('/user/following');
    return response;
  }
}

export const followerService = new FollowerService();

