import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import InfoDisplay from '@components/timeline/InfoDisplay';
import BasicInfoSkeleton from '@components/timeline/BasicInfoSkeleton';
import { userService } from '@services/api/user/user.service';
import { Utils } from '@services/utils/utils.service';
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
}

const BasicInfo = ({
  editableInputs,
  editableSocialInputs,
  username,
  profile,
  loading,
  setEditableInputs,
  setEditableSocialInputs
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
      const response = await userService.updateBasicInfo(editableInputs);
      Utils.dispatchNotification(response.data.message, 'success', dispatch);
    } catch (error: any) {
      Utils.dispatchNotification(error?.response?.data?.message || 'An error occurred', 'error', dispatch);
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

