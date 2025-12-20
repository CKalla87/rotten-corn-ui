import PropTypes from 'prop-types';
import './TypingIndicator.scss';

interface TypingIndicatorProps {
  username?: string;
}

const TypingIndicator = ({ username }: TypingIndicatorProps) => {
  return (
    <div className="typing-indicator" data-testid="typing-indicator">
      <div className="typing-indicator-content">
        <div className="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        {username && <span className="typing-username">{username} is typing...</span>}
      </div>
    </div>
  );
};

TypingIndicator.propTypes = {
  username: PropTypes.string
};

export default TypingIndicator;


