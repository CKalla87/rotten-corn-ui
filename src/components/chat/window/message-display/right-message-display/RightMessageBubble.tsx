import PropTypes from 'prop-types';
import './RightMessageBubble.scss';

interface RightMessageBubbleProps {
  chat?: {
    body?: string;
    selectedImage?: string;
    [key: string]: unknown;
  };
  showImageModal?: boolean;
  setImageUrl?: (url: string) => void;
  setShowImageModal?: (show: boolean) => void;
}

const RightMessageBubble = ({ chat, showImageModal, setImageUrl, setShowImageModal }: RightMessageBubbleProps) => {
  return (
    <>
      {chat?.body !== 'Sent a GIF' && chat?.body !== 'Sent an Image' && (
        <div className="message-bubble right-message-bubble">{chat?.body}</div>
      )}
      {chat?.selectedImage && (
        <div
          className="message-image"
          style={{ marginTop: `${chat?.body && chat?.body !== 'Sent an Image' ? '5px' : ''}` }}
        >
          <img
            src={chat?.selectedImage}
            onClick={() => {
              setImageUrl?.(chat?.selectedImage || '');
              setShowImageModal?.(!showImageModal);
            }}
            alt=""
          />
        </div>
      )}
    </>
  );
};

RightMessageBubble.propTypes = {
  chat: PropTypes.object,
  showImageModal: PropTypes.bool,
  setImageUrl: PropTypes.func,
  setShowImageModal: PropTypes.func
};

export default RightMessageBubble;


