import PropTypes from 'prop-types';
import { FaTrash } from 'react-icons/fa';
import Avatar from '@components/avatar/Avatar';
import { timeAgo } from '@services/utils/timeago.utils';
import './GalleryImage.scss';

interface GalleryImageProps {
  post?: {
    username?: string;
    avatarColor?: string;
    profilePicture?: string;
    createdAt?: string | Date;
    [key: string]: unknown;
  };
  showCaption?: boolean;
  showDelete?: boolean;
  imgSrc?: string;
  onClick?: () => void;
  onRemoveImage?: (event?: React.MouseEvent) => void;
}

const GalleryImage = ({ post, showCaption, showDelete, imgSrc, onClick, onRemoveImage }: GalleryImageProps) => {
  return (
    <figure className="gallery-image" onClick={onClick} data-testid="gallery">
      <div className="gallery-image_crop">
        <img className="gallery-image_media" src={imgSrc} alt="" />
        {showDelete && (
          <span
            className="gallery-image_delete"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveImage?.(e);
            }}
          >
            <FaTrash />
          </span>
        )}
      </div>
      {showCaption && (
        <figcaption className="gallery-image_caption">
          <div className="figure-header">
            <Avatar
              name={post?.username}
              bgColor={post?.avatarColor}
              textColor="#ffffff"
              size={40}
              avatarSrc={post?.profilePicture}
            />
            <div className="figure-body">
              <span className="figure-title">{post?.username}</span>
              <span className="figure-date">{timeAgo.transform(post?.createdAt || '')}</span>
            </div>
          </div>
        </figcaption>
      )}
    </figure>
  );
};

GalleryImage.propTypes = {
  post: PropTypes.object,
  showCaption: PropTypes.bool,
  showDelete: PropTypes.bool,
  imgSrc: PropTypes.string,
  onClick: PropTypes.func,
  onRemoveImage: PropTypes.func
};

export default GalleryImage;

