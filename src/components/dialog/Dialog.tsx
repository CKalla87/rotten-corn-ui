import PropTypes from 'prop-types';
import Button from '@components/button/Button';
import './Dialog.scss';

interface DialogProps {
  title?: string;
  firstButtonText?: string;
  secondButtonText?: string;
  firstBtnHandler?: () => void;
  secondBtnHandler?: () => void;
}

const Dialog = ({ title, firstButtonText, secondButtonText, firstBtnHandler, secondBtnHandler }: DialogProps) => {
  return (
    <div className="dialog-container" data-testid="dialog-container" onClick={(e) => {
      if (e.target === e.currentTarget) {
        secondBtnHandler?.();
      }
    }}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h4>{title || 'Confirm Action'}</h4>
        <div className="btn-container">
          <Button className="btn button cancel-btn" label={secondButtonText || 'Cancel'} handleClick={secondBtnHandler} />
          <Button className="btn button delete-btn" label={firstButtonText || 'Confirm'} handleClick={firstBtnHandler} />
        </div>
      </div>
    </div>
  );
};

Dialog.propTypes = {
  title: PropTypes.string,
  firstButtonText: PropTypes.string,
  secondButtonText: PropTypes.string,
  firstBtnHandler: PropTypes.func,
  secondBtnHandler: PropTypes.func
};

export default Dialog;

