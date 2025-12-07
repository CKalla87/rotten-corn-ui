import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { AxiosError } from 'axios';
import './Login.sass';
import { FaArrowRight } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import Input from '@components/input/Input';
import Button from '@components/button/Button';
import { OAuthButton } from '@components/oauth-button';
import { authService } from '@services/api/auth/auth.service';
import useLocalStorage from '@hooks/useLocalStorage';
import useSessionStorage from '@hooks/useSessionStorage';
import { Utils } from '@services/utils/utils.service';
import type { AppDispatch } from '@redux/store';
import type { UserProfile } from '@redux/reducers/user/userSlice';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [setStoredUsername] = useLocalStorage<string>('username', 'set') as [(value: string) => void];
  const [setLoggedIn] = useLocalStorage<boolean>('keepLoggedIn', 'set') as [(value: boolean) => void];
  const [pageReload] = useSessionStorage<boolean>('pageReload', 'set') as [(value: boolean) => void];
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const loginUser = async (event: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    event.preventDefault();
    try {
      console.log('Login attempt:', { username, passwordLength: password.length });
      const result = await authService.signIn({ username, password });
      console.log('Login success:', result.data);
      setUser(result.data.user);
      setLoggedIn(keepLoggedIn);
      setStoredUsername(username);
      setHasError(false);
      setAlertType('alert-success');
      Utils.dispatchUser(result, pageReload, dispatch, setUser);
      setLoading(false);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error('Login error:', axiosError?.response?.data || error);
      setLoading(false);
      setHasError(true);
      setAlertType('alert-error');
      
      // Check for network errors
      if (axiosError?.code === 'ERR_NETWORK' || axiosError?.message === 'Network Error') {
        // Use a try-catch to handle import.meta which may not be available in test environment
        let env = 'local';
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const metaEnv = (globalThis as any).import?.meta?.env;
          if (metaEnv) {
            env = metaEnv.VITE_APP_ENVIRONMENT || metaEnv.MODE || 'local';
          }
        } catch {
          // In test environment, default to local
          env = 'local';
        }
        if (env === 'development' || env === 'staging' || env === 'production') {
          setErrorMessage('Unable to connect to the server. Please check your internet connection or ensure the backend server is running.');
        } else {
          setErrorMessage('Unable to connect to the server. Please ensure the backend server is running on http://localhost:5000');
        }
      } else {
        setErrorMessage(axiosError?.response?.data?.message || 'An error occurred during login');
      }
    }
  };

  useEffect(() => {
    if (loading && !user) return;
    if (user) {
      navigate('/app/social/streams');
    }
  }, [loading, user, navigate]);

  return (
    <div className="auth-inner">
      {hasError && errorMessage && (
        <div className={`alerts ${alertType}`} role="alert">
          {errorMessage}
        </div>
      )}
      <div className="oauth-section">
        <OAuthButton provider="google" />
        <OAuthButton provider="github" />
        <OAuthButton provider="facebook" />
      </div>
      <div className="divider">
        <span>OR</span>
      </div>
      <form className="auth-form" onSubmit={loginUser}>
        <div className="form-input-container">
          <Input
            id="username"
            name="username"
            type="text"
            value={username}
            labelText="Username"
            placeholder="Enter Username"
            style={{ border: `${hasError ? '1px solid #fa9b8a' : ''}` }}
            handleChange={(event) => setUsername(event.target.value)}
          />
          <Input
            id="password"
            name="password"
            type="password"
            value={password}
            labelText="Password"
            placeholder="Enter Password"
            style={{ border: `${hasError ? '1px solid #fa9b8a' : ''}` }}
            handleChange={(event) => setPassword(event.target.value)}
          />
          <label className="checkmark-container" htmlFor="checkbox">
            <Input 
              id="checkbox" 
              name="checkbox" 
              type="checkbox" 
              value={keepLoggedIn}
              handleChange={() => setKeepLoggedIn(!keepLoggedIn)}
            />
            Keep me signed in
          </label>
        </div>
        <Button 
          label={loading ? 'SIGNIN IN PROGRESS...' : 'SIGNIN'}
          className="auth-button button"
          disabled={!username || !password}
        />
        <Link to={'/forgot-password'}>
          <span className="forgot-password">
            Forgot password? <FaArrowRight className="arrow-right" />
          </span>
        </Link>
      </form>
    </div>
  );
};

export default Login;

