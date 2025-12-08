import PropTypes from 'prop-types';
import EmojiPickerComponent from 'emoji-picker-react';
import './EmojiPicker.scss';

interface EmojiPickerProps {
  onEmojiClick?: (event: unknown, eventObject: unknown) => void;
  pickerStyle?: React.CSSProperties;
}

const EmojiPicker = ({ onEmojiClick, pickerStyle }: EmojiPickerProps) => {
  return (
    <div className="emoji-picker" data-testid="emoji-container">
      <EmojiPickerComponent
        onEmojiClick={onEmojiClick}
        {...(pickerStyle ? { style: pickerStyle } : {})}
      />
    </div>
  );
};

EmojiPicker.propTypes = {
  onEmojiClick: PropTypes.func,
  pickerStyle: PropTypes.object
};

export default EmojiPicker;

