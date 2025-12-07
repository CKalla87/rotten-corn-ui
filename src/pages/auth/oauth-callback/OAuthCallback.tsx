import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { authService, type OAuthProvider } from '@services/api/auth/auth.service';
import { Utils } from '@services/utils/utils.service';
import useLocalStorage from '@hooks/useLocalStorage';
import useSessionStorage from '@hooks/useSessionStorage';
import type { AppDispatch } from '@redux/store';
import type { UserProfile } from '@redux/reducers/user/userSlice';
import PageLoader from '@components/page-loader/PageLoader';
import './OAuthCallback.sass';

const OAuthCallback = () => {
  const { provider: providerParam } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [setStoredUsername] = useLocalStorage<string>('username', 'set') as [(value: string) => void];
  const [setLoggedIn] = useLocalStorage<boolean>('keepLoggedIn', 'set') as [(value: boolean) => void];
  const [pageReload] = useSessionStorage<boolean>('pageReload', 'set') as [(value: boolean) => void];
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get provider from URL params or query params
        const provider = (providerParam || searchParams.get('provider')) as OAuthProvider | null;

        if (!provider) {
          throw new Error('OAuth provider not specified');
        }

        // Get authorization code from query params
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          throw new Error(`OAuth error: ${errorParam}`);
        }

        if (!code) {
          throw new Error('Authorization code not found');
        }

        // Call backend to exchange code for token
        const result = await authService.handleOAuthCallback(provider, code, state || undefined);
        
        if (result.data?.user && result.data?.token) {
          const user = result.data.user as UserProfile;
          setLoggedIn(true);
          setStoredUsername(user.username || user.email || '');
          Utils.dispatchUser(result, pageReload, dispatch, () => {});
          navigate('/app/social/streams');
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        const errorMessage = axiosError?.response?.data?.message || 
                           axiosError?.message || 
                           'OAuth authentication failed';
        setError(errorMessage);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };

    handleOAuthCallback();
  }, [providerParam, searchParams, dispatch, navigate, setLoggedIn, setStoredUsername, pageReload]);

  if (error) {
    return (
      <div className="oauth-callback-error">
        <div className="error-message">
          <h2>Authentication Failed</h2>
          <p>{error}</p>
          <p>Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="oauth-callback">
      <PageLoader />
      <p className="oauth-callback-message">Completing authentication...</p>
    </div>
  );
};

export default OAuthCallback;
