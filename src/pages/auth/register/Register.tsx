import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import Input from '@components/input/Input';
import Button from '@components/button/Button';
import { OAuthButton } from '@components/oauth-button';
import { authService } from '@services/api/auth/auth.service';
import { Utils } from '@services/utils/utils.service';
import useLocalStorage from '@hooks/useLocalStorage';
import useSessionStorage from '@hooks/useSessionStorage';
import type { AppDispatch } from '@redux/store';
import type { UserProfile } from '@redux/reducers/user/userSlice';
import './Register.sass';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [hasError, setHasError] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [setStoredUsername] = useLocalStorage<string>('username', 'set') as [(value: string) => void];
  const [setLoggedIn] = useLocalStorage<boolean>('keepLoggedIn', 'set') as [(value: boolean) => void];
  const [pageReload] = useSessionStorage<boolean>('pageReload', 'set') as [(value: boolean) => void];
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const registerUser = async (event: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    event.preventDefault();
    try {
      const avatarColor = Utils.avatarColor();
      const avatarImage = Utils.generateAvatar(username.charAt(0).toUpperCase(), avatarColor);
      const result = await authService.signUp({ username, email, password, avatarColor, avatarImage });
      setUser(result.data.user);
      setLoggedIn(true);
      setStoredUsername(username);
      setAlertType('alert-success');
      Utils.dispatchUser(result, pageReload, dispatch, setUser);
      setLoading(false);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      setLoading(false);
      setHasError(true);
      setAlertType('alert-error');
      setErrorMessage(axiosError?.response?.data?.message || 'An error occurred during registration');
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
      <form className="auth-form" onSubmit={registerUser}>
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
            id="email"
            name="email"
            type="text"
            value={email}
            labelText="Email"
            placeholder="Enter Email"
            style={{ border: `${hasError ? '1px solid #fa9b8a' : ''}` }}
            handleChange={(event) => setEmail(event.target.value)}
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
        </div>
        <Button
          label={loading ? 'SIGNUP IN PROGRESS...' : 'SIGNUP'}
          className="auth-button button"
          disabled={!username || !email || !password}
        />
      </form>
    </div>
  );
};

export default Register;

