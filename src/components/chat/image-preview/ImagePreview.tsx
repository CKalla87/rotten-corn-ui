import PropTypes from 'prop-types';
import { FaTimes } from 'react-icons/fa';
import './ImagePreview.scss';

interface ImagePreviewProps {
  image?: string;
  onRemoveImage?: () => void;
}

const ImagePreview = ({ image, onRemoveImage }: ImagePreviewProps) => {
  return (
    <div className="image-preview-container" data-testid="image-preview">
      <div className="image-preview">
        <img className="img" src={image} alt="" />
        <FaTimes className="icon" onClick={onRemoveImage} />
      </div>
    </div>
  );
};

ImagePreview.propTypes = {
  image: PropTypes.string,
  onRemoveImage: PropTypes.func
};

export default ImagePreview;


