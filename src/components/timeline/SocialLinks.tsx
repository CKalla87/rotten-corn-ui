import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import InfoDisplay from '@components/timeline/InfoDisplay';
import BasicInfoSkeleton from '@components/timeline/BasicInfoSkeleton';
import { userService } from '@services/api/user/user.service';
import { Utils } from '@services/utils/utils.service';
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
}

const SocialLinks = ({ editableSocialInputs, username, profile, loading, setEditableSocialInputs }: SocialLinksProps) => {
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
      console.log(editableSocialInputs);
      const response = await userService.updateSocialLinks(editableSocialInputs);
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


