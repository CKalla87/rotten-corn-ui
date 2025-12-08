import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaCamera } from 'react-icons/fa';
import Avatar from '@components/avatar/Avatar';
import Button from '@components/button/Button';
import Input from '@components/input/Input';
import Spinner from '@components/spinner/Spinner';
import { ImageGridModal } from '@components/image-grid-modal';
import './BackgroundHeader.scss';

interface BackgroundSelectDropdownProps {
  galleryImages: Array<Record<string, unknown>>;
  onSelect: () => void;
  onUpload: (event: React.MouseEvent) => void;
}

const BackgroundSelectDropdown = ({ galleryImages, onSelect, onUpload }: BackgroundSelectDropdownProps) => {
  return (
    <nav className="menu" data-testid="menu">
      <ul>
        {galleryImages.length > 0 && (
          <li onClick={onSelect}>
            <div className="item">Select</div>
          </li>
        )}
        <li onClick={onUpload}>
          <div className="item">Upload</div>
        </li>
      </ul>
    </nav>
  );
};

interface BackgroundHeaderProps {
  user?: {
    username?: string;
    avatarColor?: string;
    profilePicture?: string;
    bgImageId?: string;
    [key: string]: unknown;
  };
  loading?: boolean;
  url?: string;
  profilePictureUrl?: string;
  onClick?: (data?: string) => void;
  tab?: string | Record<string, unknown>;
  hasImage?: boolean;
  tabItems?: Array<{
    key?: string;
    show?: boolean;
    icon?: React.ReactNode;
    [key: string]: unknown;
  }>;
  hasError?: boolean;
  hideSettings?: boolean;
  selectedFileImage?: (file: File | string | null, type?: string) => void;
  saveImage?: (type: string) => void;
  cancelFileSelection?: () => void;
  removeBackgroundImage?: (bgImageId?: string) => void;
  galleryImages?: Array<Record<string, unknown>>;
}

const BackgroundHeader = ({
  user,
  loading,
  url,
  profilePictureUrl,
  onClick,
  tab,
  hasImage,
  tabItems,
  hasError,
  hideSettings,
  selectedFileImage,
  saveImage,
  cancelFileSelection,
  removeBackgroundImage,
  galleryImages = []
}: BackgroundHeaderProps) => {
  const [selectedBackground, setSelectedBackground] = useState('');
  const [selectedProfileImage, setSelectedProfileImage] = useState('');
  const [showSpinner, setShowSpinner] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [showImagesModal, setShowImagesModal] = useState(false);
  const backgroundFileRef = useRef<HTMLInputElement>(null);
  const profileImageRef = useRef<HTMLInputElement>(null);

  const backgroundFileInputClicked = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    backgroundFileRef.current?.click();
  };


  const hideSaveChangesContainer = () => {
    setSelectedBackground('');
    setSelectedProfileImage('');
    setShowSpinner(false);
  };

  const onAddProfileClick = () => {
    setIsActive(!isActive);
  };

  useEffect(() => {
    if (!hasImage) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setShowSpinner(false);
      }, 0);
    }
  }, [hasImage]);


  const handleSaveImage = () => {
    setShowSpinner(true);
    const type = selectedBackground ? 'background' : 'profile';
    saveImage?.(type);
    // Reset file input after save to prevent re-triggering
    if (type === 'profile' && profileImageRef.current) {
      profileImageRef.current.value = '';
    }
    if (type === 'background' && backgroundFileRef.current) {
      backgroundFileRef.current.value = '';
    }
  };


  return (
    <>
      {showImagesModal && (
        <ImageGridModal
          images={galleryImages}
          closeModal={() => setShowImagesModal(false)}
          selectedImage={(event) => {
            setSelectedBackground(event);
            selectedFileImage?.(event, 'background');
          }}
        />
      )}
      {loading ? (
        <div className="profile-banner" data-testid="profile-banner-skeleton">
          <div className="profile-banner-skeleton-content">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-name"></div>
          </div>
        </div>
      ) : (
        <div className="profile-banner" data-testid="profile-banner">
          {hasImage && (
        <div className="save-changes-container" data-testid="save-changes-container">
          <div className="save-changes-box">
            <div className="save-changes-text">
              <h3>Save Changes?</h3>
              <p>{selectedBackground ? 'Do you want to save this background image?' : 'Do you want to save this profile picture?'}</p>
            </div>
            <div className="spinner-container">
              {showSpinner && !hasError && <Spinner bgColor="white" />}
            </div>
            <div className="save-changes-buttons">
              <div className="save-changes-buttons-bg">
                <Button
                  label="Cancel"
                  className="cancel change-btn"
                  disabled={false}
                  handleClick={() => {
                    setShowSpinner(false);
                    cancelFileSelection?.();
                    hideSaveChangesContainer();
                  }}
                />
                <Button
                  label="Save Changes"
                  className="save change-btn"
                  disabled={false}
                  handleClick={handleSaveImage}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      <div
        data-testid="profile-banner-image"
        className="profile-banner-image"
        style={{ background: `${!selectedBackground && !url ? 'var(--white-2)' : ''}` }}
      >
        {url && hideSettings && (
          <div className="delete-btn" data-testid="delete-btn">
            <Button
              label="Remove"
              className="remove"
              disabled={false}
              handleClick={() => removeBackgroundImage?.(user?.bgImageId as string)}
            />
          </div>
        )}
        {selectedBackground && <img src={`${selectedBackground}`} alt="" />}
        {!selectedBackground && url && <img src={`${url}`} alt="" />}
      </div>
      <div className="profile-banner-data">
        <div
          data-testid="profile-pic"
          className="profile-pic"
          style={{ width: `${profilePictureUrl ? '180px' : ''}` }}
        >
          <Avatar
            name={user?.username}
            bgColor={user?.avatarColor}
            textColor="#ffffff"
            size={180}
            avatarSrc={selectedProfileImage || profilePictureUrl}
          />
          {hideSettings && (
            <div className="profile-pic-select" data-testid="profile-pic-select">
              <Input
                ref={profileImageRef}
                id="profileImage"
                name="profileImage"
                type="file"
                className="inputFile"
                labelText=""
                handleChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    setSelectedProfileImage(URL.createObjectURL(file));
                    selectedFileImage?.(file, 'profile');
                  }
                }}
                onClick={() => {
                  // Reset input value on click to allow re-selecting the same file
                  if (profileImageRef.current) {
                    profileImageRef.current.value = '';
                  }
                }}
              />
              <label htmlFor="profileImage">
                <FaCamera className="camera" />
              </label>
            </div>
          )}
        </div>
        <div className="profile-name">{user?.username || 'Danny'}</div>
        {hideSettings && (
          <div className="profile-select-image">
            <Input
              ref={backgroundFileRef}
              name="backgroundImage"
              type="file"
              className="inputFile"
              labelText=""
              onClick={() => {
                if (backgroundFileRef.current) {
                  backgroundFileRef.current.value = '';
                }
              }}
              handleChange={(event) => {
                const target = event.target as HTMLInputElement;
                const file = target.files?.[0];
                if (file) {
                  setSelectedBackground(URL.createObjectURL(file));
                  selectedFileImage?.(file, 'background');
                }
              }}
            />
            <label data-testid="add-cover-photo" onClick={onAddProfileClick}>
              <FaCamera className="camera" />
              <span>Add Cover Photo</span>
            </label>
            {isActive && (
              <BackgroundSelectDropdown
                galleryImages={galleryImages}
                onSelect={() => {
                  setShowImagesModal(true);
                  setIsActive(false);
                }}
                onUpload={(event) => {
                  backgroundFileInputClicked(event);
                  setIsActive(false);
                  setShowImagesModal(false);
                }}
              />
            )}
          </div>
        )}
      </div>
      <div className="profile-banner-items">
        <ul className="banner-nav">
          {tabItems?.map((data) => (
            <div key={data.key} data-testid="tab-elements">
              {data.show && (
                <li className="banner-nav-item">
                  <div
                    className={`banner-nav-item-name ${(typeof tab === 'string' ? tab : '') === data.key?.toLowerCase() ? 'active' : ''}`}
                    onClick={() => onClick?.(data.key?.toLowerCase() || '')}
                  >
                    {data.icon}
                    <p className="title">{data.key}</p>
                  </div>
                </li>
              )}
            </div>
          ))}
        </ul>
      </div>
        </div>
      )}
    </>
  );
};

BackgroundHeader.propTypes = {
  user: PropTypes.object,
  loading: PropTypes.bool,
  url: PropTypes.string,
  onClick: PropTypes.func,
  tab: PropTypes.string,
  hasImage: PropTypes.bool,
  tabItems: PropTypes.array,
  hasError: PropTypes.bool,
  hideSettings: PropTypes.bool,
  selectedFileImage: PropTypes.func,
  saveImage: PropTypes.func,
  cancelFileSelection: PropTypes.func,
  removeBackgroundImage: PropTypes.func,
  galleryImages: PropTypes.array
};

export default BackgroundHeader;

