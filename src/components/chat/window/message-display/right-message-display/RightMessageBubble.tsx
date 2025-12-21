import PropTypes from 'prop-types';
import { Utils } from '@services/utils/utils.service';
import './RightMessageBubble.scss';

interface RightMessageBubbleProps {
  chat?: {
    body?: string;
    selectedImage?: string;
    gifUrl?: string;
    [key: string]: unknown;
  };
  showImageModal?: boolean;
  setImageUrl?: (url: string) => void;
  setShowImageModal?: (show: boolean) => void;
}

const RightMessageBubble = ({ chat, showImageModal, setImageUrl, setShowImageModal }: RightMessageBubbleProps) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, originalUrl?: string) => {
    const fullUrl = e.currentTarget.src;
    console.error('❌ Failed to load chat image');
    console.error('   Attempted URL:', fullUrl);
    console.error('   URL length:', fullUrl.length);
    if (originalUrl && originalUrl !== fullUrl) {
      console.error('   Original URL:', originalUrl);
      console.error('   Original URL length:', originalUrl.length);
    }
    // Check if URL looks incomplete (ends with ... or is very short)
    if (fullUrl.length < 100 || fullUrl.includes('…')) {
      console.error('   ⚠️ URL appears to be truncated or incomplete');
    }
    e.currentTarget.style.display = 'none';
  };

  // Handle both base64 data URLs and Cloudinary URLs
  const getImageUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('data:')) {
      // If it's a base64 data URL, use it directly (shouldn't happen from backend, but handle it)
      return url;
    }
    // Fix Cloudinary URL typos and malformations
    return Utils.fixCloudinaryUrl(url);
  };
  
  const fixedImageUrl = chat?.selectedImage ? getImageUrl(chat.selectedImage) : null;
  const fixedGifUrl = chat?.gifUrl ? getImageUrl(chat.gifUrl) : null;

  return (
    <>
      {chat?.body !== 'Sent a GIF' && chat?.body !== 'Sent an Image' && chat?.body && (
        <div className="message-bubble right-message-bubble">{chat?.body}</div>
      )}
      {fixedImageUrl && (
        <div
          className="message-image"
          style={{ marginTop: `${chat?.body && chat?.body !== 'Sent an Image' ? '5px' : ''}` }}
        >
          <img
            src={fixedImageUrl}
            onError={(e) => handleImageError(e, chat?.selectedImage)}
            onClick={() => {
              setImageUrl?.(fixedImageUrl);
              setShowImageModal?.(!showImageModal);
            }}
            alt=""
          />
        </div>
      )}
      {fixedGifUrl && (
        <div className="message-gif">
          <img 
            src={fixedGifUrl} 
            onError={(e) => handleImageError(e, chat?.gifUrl)}
            onClick={() => {
              setImageUrl?.(fixedGifUrl);
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


