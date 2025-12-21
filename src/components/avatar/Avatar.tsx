import { useState } from 'react';
import { Utils } from '@services/utils/utils.service';
import './Avatar.scss';

interface AvatarProps {
  avatarSrc?: string;
  name?: string;
  bgColor?: string;
  textColor?: string;
  size: number;
  round?: boolean;
}

const Avatar = ({
  avatarSrc,
  name,
  bgColor,
  textColor = '#ffffff',
  size,
  round = true
}: AvatarProps) => {
  const [imageError, setImageError] = useState(false);
  const textSizeRatio = 2.2;
  const fontSize = Math.floor(size / textSizeRatio);
  const defaultBgColor = bgColor || '#50b5ff';

  // Extract first and last initials
  const getInitials = (nameStr?: string): string => {
    if (!nameStr) return '';
    
    const trimmedName = nameStr.trim();
    if (!trimmedName) return '';
    
    const words = trimmedName.split(/\s+/).filter(word => word.length > 0);
    
    if (words.length === 0) return '';
    
    if (words.length === 1) {
      // Single word: use first two characters to match chat list logic (e.g., "ckalla19" -> "CK")
      const word = words[0];
      if (word.length === 1) {
        return word.charAt(0).toUpperCase();
      }
      return word.substring(0, 2).toUpperCase();
    }
    
    // Multiple words: use first letter of first word and first letter of last word
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(name);
  const showInitials = !avatarSrc || imageError || avatarSrc === '';

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <>
      {showInitials && (
        <div
          data-testid="avatar-container"
          className="avatar-container"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: `${round ? '50%' : ''}`,
            backgroundColor: defaultBgColor,
            display: 'flex'
          }}
        >
          {initials && (
            <div
              data-testid="avatar-name"
              style={{
                color: `${textColor}`,
                fontSize: `${fontSize}px`,
                margin: 'auto',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}
            >
              {initials}
            </div>
          )}
        </div>
      )}
      {avatarSrc && !imageError && (
        <img
          src={Utils.fixCloudinaryUrl ? Utils.fixCloudinaryUrl(avatarSrc) : avatarSrc}
          alt={name || ''}
          className="avatar-content avatar-container"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: `${round ? '50%' : ''}`,
            display: 'block'
          }}
          onError={handleImageError}
        />
      )}
    </>
  );
};

export default Avatar;

