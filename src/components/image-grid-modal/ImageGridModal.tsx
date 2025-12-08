import PropTypes from 'prop-types';
import ReactionWrapper from '@components/posts/modal-wrappers/reaction-wrapper/ReactionWrapper';
import { Utils } from '@services/utils/utils.service';
import './ImageGridModal.scss';

interface ImageGridModalProps {
  images?: Array<{
    imgId?: string;
    imgVersion?: string;
    [key: string]: unknown;
  }>;
  closeModal?: () => void;
  selectedImage?: (imageUrl: string) => void;
}

const ImageGridModal = ({ images = [], closeModal, selectedImage }: ImageGridModalProps) => {
  return (
    <ReactionWrapper closeModal={closeModal}>
      <div className="modal-image-header">
        <h2>Select Photo</h2>
      </div>
      <div className="modal-image-container">
        {images.map((data, index) => (
          <img
            key={index}
            className="grid-image"
            alt=""
            src={Utils.getImage(data?.imgId as string, data?.imgVersion as string)}
            onClick={() => {
              selectedImage?.(Utils.getImage(data?.imgId as string, data?.imgVersion as string));
              closeModal?.();
            }}
          />
        ))}
      </div>
    </ReactionWrapper>
  );
};

ImageGridModal.propTypes = {
  images: PropTypes.array,
  closeModal: PropTypes.func,
  selectedImage: PropTypes.func
};

export default ImageGridModal;

