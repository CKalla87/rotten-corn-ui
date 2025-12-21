import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import InfoDisplay from '@components/timeline/InfoDisplay';
import BasicInfoSkeleton from '@components/timeline/BasicInfoSkeleton';
import { userService } from '@services/api/user/user.service';
import { Utils } from '@services/utils/utils.service';
import { updateUserProfile } from '@redux/reducers/user/userSlice';
import type { AppDispatch } from '@redux/store';
import '@components/timeline/Timeline.scss';

interface SocialLinksProps {
  editableSocialInputs?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
    [key: string]: unknown;
  };
  username?: string;
  profile?: Record<string, unknown>;
  loading?: boolean;
  setEditableSocialInputs?: (inputs: Record<string, unknown>) => void;
  onUpdateSuccess?: (savedValues?: { instagram: string; twitter: string; facebook: string; youtube: string }) => Promise<void>;
}

const SocialLinks = ({ editableSocialInputs, username, profile, loading, setEditableSocialInputs, onUpdateSuccess }: SocialLinksProps) => {
  const dispatch = useDispatch<AppDispatch>();

  const noBasicInfo = {
    quoteMsg: '',
    workMsg: '',
    schoolMsg: '',
    locationMsg: ''
  };

  const noSocialInfo = {
    instagramMsg: 'No link available',
    twitterMsg: 'No link available',
    facebookMsg: 'No link available',
    youtubeMsg: 'No link available'
  };

  const editableInputs = {
    quote: '',
    work: '',
    school: '',
    location: ''
  };

  const editableSocialLinks = editableSocialInputs ?? {
    instagram: '',
    twitter: '',
    facebook: '',
    youtube: ''
  };

  const basicInfoPlaceholder = {
    quotePlacehoder: '',
    workPlacehoder: '',
    schoolPlacehoder: '',
    locationPlacehoder: ''
  };

  const socialLinksPlaceholder = {
    instagramPlacehoder: 'Add your Instagram account link',
    twitterPlacehoder: 'Add your Twitter account link',
    facebookPlacehoder: 'Add your Facebook account link',
    youtubePlacehoder: 'Add your YouTube account link'
  };

  const updateSocialLinks = async () => {
    try {
      // Only allow updates if viewing own profile
      const isCurrentUser = username === profile?.username;
      if (!isCurrentUser) {
        Utils.dispatchNotification('You can only update your own profile', 'error', dispatch);
        return;
      }
      
      // Get the authenticated user's ID directly from the backend to ensure accuracy
      // This prevents any issues with stale Redux state
      let currentUserId: string;
      let currentUsername: string;
      
      try {
        const currentUserResponse = await userService.checkCurrentUser();
        if (!currentUserResponse?.data?.user?._id) {
          Utils.dispatchNotification('Unable to verify your identity. Please log in again.', 'error', dispatch);
          return;
        }
        currentUserId = String(currentUserResponse.data.user._id);
        currentUsername = String(currentUserResponse.data.user.username || '');
        
        // Verify the username matches what we expect
        if (currentUsername && username && currentUsername.toLowerCase() !== username.toLowerCase()) {
          Utils.dispatchNotification('User mismatch detected. Please refresh the page.', 'error', dispatch);
          return;
        }
      } catch {
        Utils.dispatchNotification('Unable to verify your identity. Please log in again.', 'error', dispatch);
        return;
      }
      
      // Ensure we're sending clean data
      // Build the social object with proper field names
      // Backend expects flat structure: { instagram: '', twitter: '', facebook: '', youtube: '' }
      // Use the authenticated user's ID from the backend, not from Redux
      const socialData: Record<string, string> = {
        userId: currentUserId,
        username: currentUsername,
        instagram: editableSocialInputs?.instagram ? String(editableSocialInputs.instagram).trim() : '',
        twitter: editableSocialInputs?.twitter ? String(editableSocialInputs.twitter).trim() : '',
        facebook: editableSocialInputs?.facebook ? String(editableSocialInputs.facebook).trim() : '',
        youtube: editableSocialInputs?.youtube ? String(editableSocialInputs.youtube).trim() : ''
      };
      
      // Send social links directly (not wrapped in 'social' object)
      // Backend endpoint /user/profile/social-links expects flat structure
      const response = await userService.updateSocialLinks(socialData);
      
      // Verify the response indicates success
      if (response.status === 200 || response.status === 201) {
        if (response.data && response.data.message) {
          Utils.dispatchNotification(response.data.message, 'success', dispatch);
        } else {
          Utils.dispatchNotification('Social links updated successfully', 'success', dispatch);
        }
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
      
      // Extract social links from cleanData for state updates
      const savedSocialLinks = socialData;
      
      const savedValues = {
        instagram: String(savedSocialLinks.instagram || ''),
        twitter: String(savedSocialLinks.twitter || ''),
        facebook: String(savedSocialLinks.facebook || ''),
        youtube: String(savedSocialLinks.youtube || '')
      };
      
      // Immediately update the local state with saved values to show them in the UI
      // This ensures the UI updates right away without waiting for profile refresh
      if (setEditableSocialInputs) {
        requestAnimationFrame(() => {
          setEditableSocialInputs(savedValues);
        });
      }
      
      // Update Redux store with the saved data only if this is the current user's profile
      if (profile && isCurrentUser && profile._id === currentUserId) {
        const updatedProfile = {
          ...profile,
          social: {
            ...((profile.social as Record<string, unknown>) || {}),
            instagram: savedValues.instagram,
            twitter: savedValues.twitter,
            facebook: savedValues.facebook,
            youtube: savedValues.youtube
          }
        };
        dispatch(updateUserProfile(updatedProfile));
      }
      
      // Call callback to refresh profile data if provided (for consistency with backend)
      // Pass the saved values so they can be stored to prevent overwriting during refresh
      if (onUpdateSuccess) {
        // Wait a bit for the backend to persist the changes before refreshing
        setTimeout(async () => {
          await onUpdateSuccess(savedValues);
        }, 1000);
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  return (
    <>
      {loading ? (
        <BasicInfoSkeleton />
      ) : (
        <InfoDisplay
          title="Social Links"
          type="social"
          isCurrentUser={username === profile?.username}
          noBasicInfo={noBasicInfo}
          noSocialInfo={noSocialInfo}
          basicInfoPlaceholder={basicInfoPlaceholder}
          socialLinksPlaceholder={socialLinksPlaceholder}
          editableInputs={editableInputs}
          editableSocialInputs={editableSocialLinks}
          loading={loading}
          setEditableInputs={setEditableSocialInputs}
          setEditableSocialInputs={setEditableSocialInputs}
          updateInfo={updateSocialLinks}
        />
      )}
    </>
  );
};

SocialLinks.propTypes = {
  username: PropTypes.string,
  profile: PropTypes.object,
  loading: PropTypes.bool,
  editableSocialInputs: PropTypes.object,
  setEditableSocialInputs: PropTypes.func
};

export default SocialLinks;


