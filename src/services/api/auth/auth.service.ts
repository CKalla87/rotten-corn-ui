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

export type OAuthProvider = 'google' | 'github' | 'facebook';

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

  /**
   * Initiate OAuth login flow
   * Redirects user to OAuth provider's authorization page
   */
  async initiateOAuth(provider: OAuthProvider) {
    // Get the base URL from environment or use current origin
    const baseUrl = import.meta.env.VITE_BASE_ENDPOINT || window.location.origin;
    const apiBase = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') 
      ? '' 
      : baseUrl.replace(/\/$/, '');
    
    // Construct callback URL for frontend
    const callbackUrl = `${window.location.origin}/auth/${provider}/callback`;
    
    // Redirect to backend OAuth endpoint with callback URL
    const redirectUrl = `${apiBase}/api/v1/auth/${provider}?redirect_uri=${encodeURIComponent(callbackUrl)}`;
    window.location.href = redirectUrl;
  }

  /**
   * Handle OAuth callback after provider redirects back
   * This should be called from the OAuth callback page
   */
  async handleOAuthCallback(provider: OAuthProvider, code: string, state?: string) {
    const response = await axios.post(`/auth/${provider}/callback`, { code, state });
    return response;
  }
}

export const authService = new AuthService();

