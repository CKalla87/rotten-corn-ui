import { FaGoogle, FaGithub, FaFacebook } from 'react-icons/fa';
import { authService, type OAuthProvider } from '@services/api/auth/auth.service';
import './OAuthButton.sass';

interface OAuthButtonProps {
  provider: OAuthProvider;
  label?: string;
  className?: string;
}

const OAuthButton = ({ provider, label, className = '' }: OAuthButtonProps) => {
  const handleOAuthClick = () => {
    authService.initiateOAuth(provider);
  };

  const getProviderIcon = () => {
    switch (provider) {
      case 'google':
        return <FaGoogle className="oauth-icon" />;
      case 'github':
        return <FaGithub className="oauth-icon" />;
      case 'facebook':
        return <FaFacebook className="oauth-icon" />;
      default:
        return null;
    }
  };

  const getProviderLabel = () => {
    if (label) return label;
    switch (provider) {
      case 'google':
        return 'Continue with Google';
      case 'github':
        return 'Continue with GitHub';
      case 'facebook':
        return 'Continue with Facebook';
      default:
        return `Continue with ${provider}`;
    }
  };

  const getProviderClass = () => {
    return `oauth-button oauth-button-${provider} ${className}`.trim();
  };

  return (
    <button
      type="button"
      className={getProviderClass()}
      onClick={handleOAuthClick}
    >
      {getProviderIcon()}
      <span>{getProviderLabel()}</span>
    </button>
  );
};

export default OAuthButton;
