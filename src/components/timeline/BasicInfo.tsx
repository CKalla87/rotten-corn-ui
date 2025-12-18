import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import InfoDisplay from '@components/timeline/InfoDisplay';
import BasicInfoSkeleton from '@components/timeline/BasicInfoSkeleton';
import { userService } from '@services/api/user/user.service';
import { Utils } from '@services/utils/utils.service';
import { updateUserProfile } from '@redux/reducers/user/userSlice';
import type { AppDispatch } from '@redux/store';
import '@components/timeline/Timeline.scss';

interface BasicInfoProps {
  editableInputs?: {
    quote?: string;
    work?: string;
    school?: string;
    location?: string;
    [key: string]: unknown;
  };
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
  setEditableInputs?: (inputs: Record<string, unknown>) => void;
  setEditableSocialInputs?: (inputs: Record<string, unknown>) => void;
  onUpdateSuccess?: () => void;
}

const BasicInfo = ({
  editableInputs,
  editableSocialInputs,
  username,
  profile,
  loading,
  setEditableInputs,
  setEditableSocialInputs,
  onUpdateSuccess
}: BasicInfoProps) => {
  const dispatch = useDispatch<AppDispatch>();

  const noBasicInfo = {
    quoteMsg: 'No information',
    workMsg: 'No information',
    schoolMsg: 'No information',
    locationMsg: 'No information'
  };

  const noSocialInfo = {
    instagramMsg: 'No information',
    twitterMsg: 'No information',
    facebookMsg: 'No information',
    youtubeMsg: 'No information'
  };

  const basicInfoPlaceholder = {
    quotePlacehoder: 'Add your quote',
    workPlacehoder: 'Add company name',
    schoolPlacehoder: 'Add school name',
    locationPlacehoder: 'Add city and country names'
  };

  const socialLinksPlaceholder = {
    instagramPlacehoder: '',
    twitterPlacehoder: '',
    facebookPlacehoder: '',
    youtubePlacehoder: ''
  };

  const updateBasicInfo = async () => {
    try {
      // Ensure we're sending clean data (the editableInputs should already be clean from user input)
      const cleanData = {
        quote: editableInputs?.quote || '',
        work: editableInputs?.work || '',
        school: editableInputs?.school || '',
        location: editableInputs?.location || ''
      };
      
      const response = await userService.updateBasicInfo(cleanData);
      Utils.dispatchNotification(response.data.message, 'success', dispatch);
      
      // Update the local state with saved values after a brief delay
      // This ensures the disabled state is set first, allowing ContentEditable to update
      if (setEditableInputs) {
        // Use requestAnimationFrame to ensure the disabled state change has been processed
        requestAnimationFrame(() => {
          // Create a new object to ensure React sees it as a state change
          const newInputs = {
            quote: String(cleanData.quote || ''),
            work: String(cleanData.work || ''),
            school: String(cleanData.school || ''),
            location: String(cleanData.location || '')
          };
          setEditableInputs(newInputs);
        });
      }
      
      // Update Redux store with the saved data
      if (profile) {
        const updatedProfile = {
          ...profile,
          quote: cleanData.quote,
          work: cleanData.work,
          school: cleanData.school,
          location: cleanData.location
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
          title="Intro"
          type="basic"
          isCurrentUser={username === profile?.username}
          noBasicInfo={noBasicInfo}
          noSocialInfo={noSocialInfo}
          basicInfoPlaceholder={basicInfoPlaceholder}
          socialLinksPlaceholder={socialLinksPlaceholder}
          editableInputs={editableInputs}
          editableSocialInputs={editableSocialInputs}
          setEditableInputs={setEditableInputs}
          setEditableSocialInputs={setEditableSocialInputs}
          updateInfo={updateBasicInfo}
        />
      )}
    </>
  );
};

BasicInfo.propTypes = {
  username: PropTypes.string,
  profile: PropTypes.object,
  loading: PropTypes.bool,
  editableInputs: PropTypes.object,
  editableSocialInputs: PropTypes.object,
  setEditableInputs: PropTypes.func,
  setEditableSocialInputs: PropTypes.func
};

export default BasicInfo;

