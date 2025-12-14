import axios, { getBaseEndpoint } from '@services/axios';

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

  async resetPassword(token: string, body: Record<string, unknown>) {
    const response = await axios.post(`/reset-password/${token}`, body);
    return response;
  }

  async authPostData(url: string, data: Record<string, unknown>, token: string) {
    const response = await axios.post(`/${url}/${token}`, data);
    return response;
  }

  /**
   * Initiate OAuth login flow
   * Redirects user to OAuth provider's authorization page via backend
   */
  async initiateOAuth(provider: OAuthProvider) {
    try {
      // Get BASE_ENDPOINT at runtime (not build time) to ensure hostname detection works
      const apiBase = getBaseEndpoint();
      
      // The redirect_uri is where the user should land AFTER OAuth completes (frontend URL)
      // This must match the callback route in the frontend and what's configured in OAuth provider
      const redirectUri = `${window.location.origin}/auth/${provider}/callback`;
      
      // Construct the backend OAuth URL
      // Always use full URL with apiBase (should never be empty in production)
      const backendOAuthUrl = apiBase 
        ? `${apiBase}/api/v1/auth/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`
        : `/api/v1/auth/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;
      
      // Log for debugging (remove in production if needed)
      console.log('Initiating OAuth:', {
        provider,
        redirectUri,
        backendOAuthUrl,
        apiBase
      });
      
      // Redirect to backend OAuth endpoint - backend will handle redirecting to Google
      window.location.href = backendOAuthUrl;
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      throw error;
    }
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

