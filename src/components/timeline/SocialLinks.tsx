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
  onUpdateSuccess?: () => Promise<void>;
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
      // Ensure we're sending clean data
      // Build the social object, using null for empty strings if API expects that
      const socialData: Record<string, string | null> = {};
      if (editableSocialInputs?.instagram) {
        socialData.instagram = String(editableSocialInputs.instagram).trim();
      } else {
        socialData.instagram = null;
      }
      if (editableSocialInputs?.twitter) {
        socialData.twitter = String(editableSocialInputs.twitter).trim();
      } else {
        socialData.twitter = null;
      }
      if (editableSocialInputs?.facebook) {
        socialData.facebook = String(editableSocialInputs.facebook).trim();
      } else {
        socialData.facebook = null;
      }
      if (editableSocialInputs?.youtube) {
        socialData.youtube = String(editableSocialInputs.youtube).trim();
      } else {
        socialData.youtube = null;
      }
      
      // Try sending with 'social' wrapper (API might expect this format)
      const cleanData = { social: socialData };
      
      const response = await userService.updateSocialLinks(cleanData);
      Utils.dispatchNotification(response.data.message, 'success', dispatch);
      
      // Extract social links from cleanData for state updates
      const savedSocialLinks = cleanData.social;
      
      // Immediately update the local state with saved values to show them in the UI
      // This ensures the UI updates right away without waiting for profile refresh
      if (setEditableSocialInputs) {
        // Create a new object to ensure React sees it as a state change
        // Convert null back to empty string for display
        const newInputs = {
          instagram: String(savedSocialLinks.instagram || ''),
          twitter: String(savedSocialLinks.twitter || ''),
          facebook: String(savedSocialLinks.facebook || ''),
          youtube: String(savedSocialLinks.youtube || '')
        };
        requestAnimationFrame(() => {
          setEditableSocialInputs(newInputs);
        });
      }
      
      // Update Redux store with the saved data
      if (profile) {
        const updatedProfile = {
          ...profile,
          social: {
            ...((profile.social as Record<string, unknown>) || {}),
            instagram: savedSocialLinks.instagram || '',
            twitter: savedSocialLinks.twitter || '',
            facebook: savedSocialLinks.facebook || '',
            youtube: savedSocialLinks.youtube || ''
          }
        };
        dispatch(updateUserProfile(updatedProfile));
      }
      
      // Call callback to refresh profile data if provided (for consistency with backend)
      if (onUpdateSuccess) {
        await onUpdateSuccess();
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
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


