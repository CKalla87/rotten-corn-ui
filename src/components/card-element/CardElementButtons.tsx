import { Fragment } from 'react';
import { useNavigate, createSearchParams } from 'react-router-dom';
import Button from '@components/button/Button';
import PropTypes from 'prop-types';
import './CardElementButtons.scss';

interface CardElementButtonsProps {
  isChecked?: boolean;
  btnTextOne?: string;
  btnTextTwo?: string;
  onClickBtnOne?: () => void;
  onClickBtnTwo?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToChat?: () => void;
  userId?: string;
  username?: string;
}

const CardElementButtons = ({
  isChecked,
  btnTextOne,
  btnTextTwo,
  onClickBtnOne,
  onClickBtnTwo,
  onNavigateToProfile,
  onNavigateToChat,
  userId,
  username
}: CardElementButtonsProps) => {
  const navigate = useNavigate();

  const handleMessageClick = () => {
    if (onNavigateToChat) {
      onNavigateToChat();
    } else if (userId && username) {
      const params = createSearchParams({ 
        username: username.toLowerCase(), 
        id: userId 
      });
      navigate(`/app/social/chat/messages?${params}`);
    }
  };

  return (
    <div className="card-element-buttons" data-testid="card-element-buttons">
      <Fragment>
        {!isChecked && (
          <Button label={btnTextOne} className="card-element-buttons-btn button" handleClick={onClickBtnOne} />
        )}
        {isChecked && (
          <Button label={btnTextTwo} className="card-element-buttons-btn button isUserFollowed" handleClick={onClickBtnTwo} />
        )}
      </Fragment>
      {(userId && username) && (
        <Button label="Message" className="card-element-buttons-btn button" handleClick={handleMessageClick} />
      )}
      <Button label="Profile" className="card-element-buttons-btn button" handleClick={onNavigateToProfile} />
    </div>
  );
};

CardElementButtons.propTypes = {
  isChecked: PropTypes.bool,
  btnTextOne: PropTypes.string,
  btnTextTwo: PropTypes.string,
  onClickBtnOne: PropTypes.func,
  onClickBtnTwo: PropTypes.func,
  onNavigateToProfile: PropTypes.func,
  onNavigateToChat: PropTypes.func,
  userId: PropTypes.string,
  username: PropTypes.string
};

export default CardElementButtons;

