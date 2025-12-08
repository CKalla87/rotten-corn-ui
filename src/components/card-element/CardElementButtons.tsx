import { Fragment } from 'react';
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
}

const CardElementButtons = ({
  isChecked,
  btnTextOne,
  btnTextTwo,
  onClickBtnOne,
  onClickBtnTwo,
  onNavigateToProfile
}: CardElementButtonsProps) => {
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
  onNavigateToProfile: PropTypes.func
};

export default CardElementButtons;

