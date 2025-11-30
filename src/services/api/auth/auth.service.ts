import axios from '@services/axios';

interface SignUpBody {
  username: string;
  email: string;
  password: string;
  avatarColor: string;
  avatarImage: string;
}

interface SignInBody {
  username: string;
  password: string;
}

class AuthService {
  async signUp(body: SignUpBody) {
    const response = await axios.post('/signup', body);
    return response;
  }

  async signIn(body: SignInBody) {
    const response = await axios.post('/signin', body);
    return response;
  }

  async forgotPassword(email: string) {
    const response = await axios.post('/forgot-password', { email });
    return response;
  }

  async resetPassword(token: string, body: any) {
    const response = await axios.post(`/reset-password/${token}`, body);
    return response;
  }

  async authPostData(url: string, data: any, token: string) {
    const response = await axios.post(`/${url}/${token}`, data);
    return response;
  }
}

export const authService = new AuthService();

