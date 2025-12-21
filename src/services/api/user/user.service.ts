import axios from '@services/axios';

class UserService {
  async getUserSuggestions() {
    const response = await axios.get('/user/profile/user/suggestions');
    return response;
  }

  async logoutUser() {
    const response = await axios.get('/signout');
    return response;
  }

  async checkCurrentUser() {
    const response = await axios.get('/currentuser');
    return response;
  }

  async getAllUsers(page: number) {
    const response = await axios.get(`/user/all/${page}`);
    return response;
  }

  async searchUsers(query: string) {
    const response = await axios.get(`/user/profile/search/${query}`);
    return response;
  }

  async getUserProfileByUserId(userId: string) {
    const response = await axios.get(`/user/profile/${userId}`);
    return response;
  }

  async getUserProfileByUsername(username: string, userId: string, uId: string) {
    const response = await axios.get(`/user/profile/posts/${username}/${userId}/${uId}`);
    return response;
  }

  async changePassword(body: unknown) {
    const response = await axios.put('/user/profile/change-password', body);
    return response;
  }

  async updateNotificationSettings(settings: unknown) {
    const response = await axios.put('/user/profile/csettings', settings);
    return response;
  }

  async updateBasicInfo(info: unknown) {
    const response = await axios.put('/user/profile/basic-info', info);
    return response;
  }

  async updateSocialLinks(links: unknown) {
    // Try using basic-info endpoint - social links might be updated through basic info
    // If this doesn't work, backend might need a separate endpoint created
    // Log the request to help debug
    console.log('Updating social links with payload:', JSON.stringify(links, null, 2));
    const response = await axios.put('/user/profile/basic-info', links);
    console.log('Social links update response:', response.status, response.data);
    return response;
  }
}

export const userService = new UserService();

