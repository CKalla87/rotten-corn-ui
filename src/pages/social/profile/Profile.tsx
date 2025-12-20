import { useCallback, useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { filter } from 'lodash';
import BackgroundHeader from '@components/background-header/BackgroundHeader';
import GalleryImage from '@components/gallery-image/GalleryImage';
import Timeline from '@components/timeline/Timeline';
import FollowerCard from '@pages/social/followers/FollowerCard';
import ChangePassword from '@components/change-password/ChangePassword';
import NotificationSettings from '@components/notification-settings/NotificationSettings';
import ImageModal from '@components/image-modal/ImageModal';
import Dialog from '@components/dialog/Dialog';
import CommentsModal from '@components/posts/comments/comments-modal/CommentsModal';
import { toggleDeleteDialog } from '@redux/reducers/modal/modalSlice';
import { updateUserProfile } from '@redux/reducers/user/userSlice';
import { userService } from '@services/api/user/user.service';
import { imageService } from '@services/api/image/image.service';
import { tabItems } from '@services/utils/static.data';
import { Utils } from '@services/utils/utils.service';
import type { RootState, AppDispatch } from '@redux/store';
import './Profile.scss';

const Profile = () => {
  const { profile } = useSelector((state: RootState) => state.user);
  const { deleteDialogIsOpen, data, commentsModalIsOpen } = useSelector((state: RootState) => state.modal);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [rendered, setRendered] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const [selectedBackgroundImage, setSelectedBackgroundImage] = useState<File | string>('');
  const [selectedProfileImage, setSelectedProfileImage] = useState<File | string>('');
  const [bgUrl, setBgUrl] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState<Array<Record<string, unknown>>>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [displayContent, setDisplayContent] = useState('timeline');
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [userProfileData, setUserProfileData] = useState<Record<string, unknown> | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  const [searchParams] = useSearchParams();

  const profileRef = useRef(profile);
  
  // Keep profileRef in sync with profile
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const getUserProfileByUsername = useCallback(
    async () => {
      try {
        // If no username in URL but we have profile in Redux, use that username
        const currentProfile = profileRef.current;
        const usernameToUse = username || currentProfile?.username || '';
        if (!usernameToUse) {
          setHasError(true);
          setLoading(false);
          return;
        }
        
        const response = await userService.getUserProfileByUsername(
          usernameToUse,
          searchParams.get('id') || currentProfile?._id as string || '',
          searchParams.get('uId') || currentProfile?.uId as string || ''
        );
        
        const userData = response.data.user;
        setUser(userData);
        setUserProfileData(response.data);
        // Generate background image URL with fallback
        let bgImageUrl = Utils.getImage(userData?.bgImageId, userData?.bgImageVersion);
        // If getImage returns empty (e.g., cloud name missing), fall back to full URL
        if (!bgImageUrl && userData?.bgImage) {
          bgImageUrl = userData.bgImage as string;
        }
        if (bgImageUrl) {
          bgImageUrl = Utils.fixCloudinaryUrl(bgImageUrl);
        }
        setBgUrl(bgImageUrl);
        
        // Generate profile picture URL - try all possible field combinations
        let profilePicUrl = '';
        
        // First try: Generate from profileImageId/profileImageVersion (like background image)
        if (userData?.profileImageId && userData?.profileImageVersion) {
          profilePicUrl = Utils.getImage(userData.profileImageId, userData.profileImageVersion);
          // If getImage returns empty (e.g., cloud name missing), fall back to full URL
          if (!profilePicUrl && userData?.profilePicture) {
            profilePicUrl = userData.profilePicture as string;
          }
        }
        // Second try: Generate from avatarImageId/avatarImageVersion
        else if (userData?.avatarImageId && userData?.avatarImageVersion) {
          profilePicUrl = Utils.getImage(userData.avatarImageId, userData.avatarImageVersion);
          // If getImage returns empty (e.g., cloud name missing), fall back to full URL
          if (!profilePicUrl && userData?.profilePicture) {
            profilePicUrl = userData.profilePicture as string;
          } else if (!profilePicUrl && userData?.avatarImage) {
            profilePicUrl = userData.avatarImage as string;
          }
        }
        // Third try: Use direct URL fields
        else if (userData?.profilePicture) {
          profilePicUrl = userData.profilePicture as string;
        }
        else if (userData?.avatarImage) {
          profilePicUrl = userData.avatarImage as string;
        }
        
        // Fix Cloudinary URL if it's a full URL
        if (profilePicUrl) {
          profilePicUrl = Utils.fixCloudinaryUrl(profilePicUrl);
        }
        
        setProfilePictureUrl(profilePicUrl);
        
        // Update the user object with the profile picture URL so it persists
        if (profilePicUrl && userData) {
          userData.profilePicture = profilePicUrl;
          userData.avatarImage = profilePicUrl;
          setUser(userData);
        }
        
        // Update Redux store with generated avatarImage URL if viewing own profile
        // Use case-insensitive comparison to handle any case differences
        const usernameMatches = usernameToUse?.toLowerCase() === currentProfile?.username?.toLowerCase();
        if (usernameMatches && userData) {
          const updatedUserData = { ...userData };
          if (profilePicUrl) {
            updatedUserData.avatarImage = profilePicUrl;
            updatedUserData.profilePicture = profilePicUrl;
          }
          dispatch(updateUserProfile(updatedUserData));
        }
        
        // Verify we got the correct user - if username doesn't match, redirect to correct profile
        const returnedUsername = userData?.username as string;
        if (returnedUsername && usernameToUse && returnedUsername.toLowerCase() !== usernameToUse.toLowerCase()) {
          console.warn(`Profile API returned user "${returnedUsername}" but expected "${usernameToUse}". Redirecting to correct profile.`);
          // Redirect to the actual user's profile
          navigate(`/app/social/profile/${returnedUsername}`, { replace: true });
          return;
        }
        
        setLoading(false);
      } catch (error: unknown) {
        setHasError(true);
        setLoading(false);
        const axiosError = error as { response?: { data?: { message?: string } } };
        Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
      }
    },
    [dispatch, searchParams, username, navigate]
  );

  const getUserImages = useCallback(
    async () => {
      try {
        const userId = searchParams.get('id') || (user as { _id?: string })?._id || '';
        if (userId) {
          const imagesResponse = await imageService.getUserImages(userId);
          setGalleryImages(imagesResponse.data.images || []);
        }
      } catch (error: unknown) {
        // Don't show error notification for images if user profile loads successfully
        console.warn('Failed to load user images:', error);
        setGalleryImages([]);
      }
    },
    [searchParams, user]
  );

  const hasFetchedRef = useRef(false);
  const lastUsernameRef = useRef<string | undefined>(undefined);
  const lastSearchParamsRef = useRef<string>('');

  useEffect(() => {
    if (!rendered) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setRendered(true);
      }, 0);
      return;
    }
    
    const currentSearchParams = searchParams.toString();
    const usernameChanged = lastUsernameRef.current !== username;
    const searchParamsChanged = lastSearchParamsRef.current !== currentSearchParams;
    
    // Only fetch if username or searchParams actually changed, or if we haven't fetched yet
    if (!hasFetchedRef.current || usernameChanged || searchParamsChanged) {
      hasFetchedRef.current = true;
      lastUsernameRef.current = username;
      lastSearchParamsRef.current = currentSearchParams;
      // Use setTimeout to avoid calling setState synchronously in effect
      setTimeout(() => {
        void getUserProfileByUsername();
      }, 0);
    }
  }, [rendered, username, searchParams, getUserProfileByUsername]);

  const hasFetchedImagesRef = useRef(false);
  const lastUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (user && rendered) {
      const userId = (user as { _id?: string })?._id;
      const userIdChanged = lastUserIdRef.current !== userId;
      
      // Only fetch if userId changed or we haven't fetched yet
      if (!hasFetchedImagesRef.current || userIdChanged) {
        hasFetchedImagesRef.current = true;
        lastUserIdRef.current = userId;
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        void getUserImages();
      }, 0);
      }
    }
  }, [user, rendered, getUserImages]);

  const changeTabContent = (data?: string) => {
    setDisplayContent(data || 'timeline');
  };

  const selectedFileImage = (data: File | string | null, type?: string) => {
    setHasImage(!hasImage);
    if (type === 'background') {
      setSelectedBackgroundImage(data as File | string);
    } else {
      setSelectedProfileImage(data as File | string);
    }
  };

  const cancelFileSelection = () => {
    setHasImage(!hasImage);
    setSelectedBackgroundImage('');
    setSelectedProfileImage('');
    setHasError(false);
  };

  const saveImage = (type: string) => {
    const reader = new FileReader();
    reader.addEventListener('load', async () => addImage(reader.result as string, type), false);

    if (type === 'background' && selectedBackgroundImage) {
      if (typeof selectedBackgroundImage !== 'string') {
        reader.readAsDataURL(Utils.renameFile(selectedBackgroundImage as File));
      } else {
        addImage(selectedBackgroundImage, type);
      }
    } else if (type === 'profile' && selectedProfileImage) {
      if (typeof selectedProfileImage !== 'string') {
        reader.readAsDataURL(Utils.renameFile(selectedProfileImage as File));
      } else {
        addImage(selectedProfileImage, type);
      }
    }
  };

  const addImage = async (result: string, type: string) => {
    try {
      const url = type === 'background' ? '/images/background' : '/images/profile';
      const response = await imageService.addImage(url, result);
      
      if (response) {
        Utils.dispatchNotification(response.data.message, 'success', dispatch);
        setHasError(false);
        setHasImage(false);
        
        // Since the API doesn't return profile picture in the response, always fetch updated user profile
        // Wait a bit for the backend to process the image, then fetch
        setTimeout(async () => {
          try {
            // First, try to get the current user to update Redux
            const currentUserResponse = await userService.checkCurrentUser();
            if (currentUserResponse?.data?.user) {
              const updatedUser = { ...currentUserResponse.data.user };
              
              // Generate avatarImage URL from image ID/version if profile picture was uploaded
              if (type === 'profile') {
                let avatarImageUrl = '';
                
                if (updatedUser.profileImageId && updatedUser.profileImageVersion) {
                  avatarImageUrl = Utils.getImage(updatedUser.profileImageId as string, updatedUser.profileImageVersion as string);
                } else if (updatedUser.avatarImageId && updatedUser.avatarImageVersion) {
                  avatarImageUrl = Utils.getImage(updatedUser.avatarImageId as string, updatedUser.avatarImageVersion as string);
                } else if (updatedUser.profilePicture) {
                  avatarImageUrl = updatedUser.profilePicture as string;
                } else if (updatedUser.avatarImage) {
                  avatarImageUrl = updatedUser.avatarImage as string;
                }
                
                if (avatarImageUrl) {
                  updatedUser.avatarImage = avatarImageUrl;
                  updatedUser.profilePicture = avatarImageUrl;
                  setProfilePictureUrl(avatarImageUrl);
                }
              }
              dispatch(updateUserProfile(updatedUser));
            }
            
            // Then refresh the profile page data to get updated image IDs
            await getUserProfileByUsername();
          } catch (fetchError) {
            console.warn('Failed to fetch updated user profile:', fetchError);
            // Still try to refresh the profile page
            await getUserProfileByUsername();
          }
        }, 1000); // Increased delay to 1 second to ensure backend has processed
      }
    } catch (error: unknown) {
      setHasError(true);
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  const removeBackgroundImage = async (bgImageId?: string) => {
    try {
      setBgUrl('');
      await removeImage(`/images/background/${bgImageId}`);
    } catch (error: unknown) {
      setHasError(true);
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  const removeImageFromGallery = async (imageId: string) => {
    try {
      dispatch(toggleDeleteDialog({ toggle: false, data: null }));
      const images = filter(galleryImages, (image) => image._id !== imageId);
      setGalleryImages(images);
      await removeImage(`/images/${imageId}`);
    } catch (error: unknown) {
      setHasError(true);
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  const removeImage = async (url: string) => {
    const response = await imageService.removeImage(url);
    Utils.dispatchNotification(response.data.message, 'success', dispatch);
  };

  // If no username in URL, redirect to current user's profile
  useEffect(() => {
    if (!username && profile?.username) {
      navigate(`/app/social/profile/${profile.username}`, { replace: true });
    }
  }, [username, profile?.username, navigate]);
  
  if (!username) {
    if (!profile?.username) {
      return (
        <div className="profile-wrapper">
          <div className="profile-wrapper-container">
            <div className="profile-content">
              <p>Username is required to view profile.</p>
            </div>
          </div>
        </div>
      );
    }
    return null; // Will redirect via useEffect
  }

  return (
    <>
      {/* Render CommentsModal once at the Profile level, not inside each Post */}
      {commentsModalIsOpen && <CommentsModal />}
      {showImageModal && (
        <ImageModal image={imageUrl} onCancel={() => setShowImageModal(!showImageModal)} showArrow={false} />
      )}
      {deleteDialogIsOpen && (
        <Dialog
          title="Are you sure you want to delete this image?"
          firstButtonText="Delete"
          secondButtonText="Cancel"
          firstBtnHandler={() => removeImageFromGallery(data as string)}
          secondBtnHandler={() => dispatch(toggleDeleteDialog({ toggle: false, data: null }))}
        />
      )}
      <div className="profile-wrapper">
        <div className="profile-wrapper-container">
          <div className="profile-header">
            <BackgroundHeader
              user={user as { username?: string; avatarColor?: string; profilePicture?: string; bgImageId?: string; bgImageVersion?: string; profileImageId?: string; profileImageVersion?: string; [key: string]: unknown } | undefined}
              loading={loading}
              hasImage={hasImage}
              hasError={hasError}
              url={bgUrl}
              profilePictureUrl={profilePictureUrl}
              onClick={changeTabContent}
              selectedFileImage={selectedFileImage}
              saveImage={saveImage}
              cancelFileSelection={cancelFileSelection}
              removeBackgroundImage={removeBackgroundImage}
              tabItems={tabItems((username || '').toLowerCase() === (profile?.username || '').toLowerCase(), false).map(item => ({ ...item, [item.key]: item.key }))}
              tab={displayContent}
              hideSettings={(username || '').toLowerCase() === (profile?.username || '').toLowerCase()}
              galleryImages={galleryImages}
            />
          </div>
          <div className="profile-content">
            {displayContent === 'timeline' && (
              <Timeline 
                userProfileData={userProfileData || undefined} 
                loading={loading}
                onIntroUpdateSuccess={async () => {
                  // Refresh profile data after intro update to get the saved values
                  try {
                    const currentProfile = profileRef.current;
                    const usernameToUse = username || currentProfile?.username || '';
                    if (usernameToUse) {
                      const response = await userService.getUserProfileByUsername(
                        usernameToUse,
                        searchParams.get('id') || currentProfile?._id as string || '',
                        searchParams.get('uId') || currentProfile?.uId as string || ''
                      );
                      setUserProfileData(response.data);
                    }
                  } catch (error) {
                    console.warn('Failed to refresh profile after update:', error);
                  }
                }}
              />
            )}
            {displayContent === 'followers' && <FollowerCard userData={user || undefined} />}
            {displayContent === 'gallery' && (
              <>
                {galleryImages.length > 0 ? (
                  <div className="imageGrid-container">
                    {galleryImages.map((image) => (
                      <div key={image._id as string}>
                        <GalleryImage
                          showCaption={false}
                          showDelete={username === profile?.username}
                          imgSrc={Utils.getImage(image?.imgId as string, image?.imgVersion as string)}
                          onClick={() => {
                            setImageUrl(Utils.getImage(image?.imgId as string, image?.imgVersion as string));
                            setShowImageModal(!showImageModal);
                          }}
                          onRemoveImage={(event) => {
                            event?.stopPropagation();
                            dispatch(toggleDeleteDialog({ toggle: true, data: image?._id }));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  !loading && <p>No images to display</p>
                )}
              </>
            )}
            {displayContent === 'change password' && <ChangePassword />}
            {displayContent === 'notifications' && <NotificationSettings />}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;

