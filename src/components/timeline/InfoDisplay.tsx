import PropTypes from 'prop-types';
import { useState } from 'react';
import { FaBriefcase, FaInstagram, FaGraduationCap, FaTwitter, FaFacebook, FaYoutube, FaMapMarkerAlt } from 'react-icons/fa';
import ContentEditable from '@components/content-editable/ContentEditable';
import Button from '@components/button/Button';
import BasicInfoSkeleton from '@components/timeline/BasicInfoSkeleton';
import '@components/timeline/Timeline.scss';

interface InfoDisplayProps {
  title?: string;
  type?: string;
  isCurrentUser?: boolean;
  noBasicInfo?: {
    quoteMsg?: string;
    workMsg?: string;
    schoolMsg?: string;
    locationMsg?: string;
    [key: string]: unknown;
  };
  noSocialInfo?: {
    instagramMsg?: string;
    twitterMsg?: string;
    facebookMsg?: string;
    youtubeMsg?: string;
    [key: string]: unknown;
  };
  basicInfoPlaceholder?: {
    quotePlacehoder?: string;
    workPlacehoder?: string;
    schoolPlacehoder?: string;
    locationPlacehoder?: string;
    [key: string]: unknown;
  };
  socialLinksPlaceholder?: {
    instagramPlacehoder?: string;
    twitterPlacehoder?: string;
    facebookPlacehoder?: string;
    youtubePlacehoder?: string;
    [key: string]: unknown;
  };
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
  loading?: boolean;
  setEditableInputs?: (inputs: Record<string, unknown>) => void;
  setEditableSocialInputs?: (inputs: Record<string, unknown>) => void;
  updateInfo?: () => void;
}

const InfoDisplay = ({
  title,
  type,
  isCurrentUser,
  noBasicInfo,
  noSocialInfo,
  basicInfoPlaceholder,
  socialLinksPlaceholder,
  editableInputs,
  editableSocialInputs,
  loading,
  setEditableInputs,
  setEditableSocialInputs,
  updateInfo
}: InfoDisplayProps) => {
  const [editIntroBtn, setEditIntroBtn] = useState(true);
  const { quote, work, school, location } = editableInputs || {};
  const { quoteMsg, workMsg, schoolMsg, locationMsg } = noBasicInfo || {};
  const { instagramMsg, twitterMsg, facebookMsg, youtubeMsg } = noSocialInfo || {};
  const { instagram, twitter, facebook, youtube } = editableSocialInputs || {};
  const { quotePlacehoder, workPlacehoder, schoolPlacehoder, locationPlacehoder } = basicInfoPlaceholder || {};
  const { instagramPlacehoder, twitterPlacehoder, facebookPlacehoder, youtubePlacehoder } = socialLinksPlaceholder || {};

  return (
    <>
      {loading ? (
        <BasicInfoSkeleton />
      ) : (
        <div className="side-container" data-testid="side-container">
      <div className="side-container-header">
        <p>{title}</p>
        {isCurrentUser && (
          <p className="editBtn" data-testid="editBtn" onClick={() => setEditIntroBtn(!editIntroBtn)}>
            Edit
          </p>
        )}
      </div>
      {type === 'basic' && (
        <>
          <div className="side-container-body">
            <div className="side-container-body-about" data-testid="quote">
              {editIntroBtn && !quote && <div className="no-information">{quoteMsg}</div>}
              <ContentEditable
                data-testid="quote-editable"
                data-placeholder={quotePlacehoder}
                tagName="div"
                className="about"
                disabled={editIntroBtn}
                html={quote || ''}
                style={{ maxHeight: '70px', overflowY: 'auto', width: '250px' }}
                onChange={(event) => {
                  setEditableInputs?.({ ...editableInputs, quote: event.target.value });
                }}
              />
            </div>
          </div>
          <div className="side-container-body">
            <div className="side-container-body-icon">
              <FaBriefcase className="icon" />
            </div>
            <div className="side-container-body-content" data-testid="content-1">
              {type === 'basic' && editIntroBtn && work && <>Works at</>}
              {type === 'basic' && editIntroBtn && !work && <div className="no-information">{workMsg}</div>}
              {type !== 'basic' && editIntroBtn && instagram && (
                <a className="link" href={instagram} target="_blank" rel="noreferrer noopener">
                  {instagram}
                </a>
              )}
              {type !== 'basic' && editIntroBtn && !instagram && <div className="no-information">{instagramMsg}</div>}
              <ContentEditable
                data-testid="content-1-editable"
                data-placeholder={type === 'basic' ? workPlacehoder : instagramPlacehoder}
                tagName={!editIntroBtn ? 'div' : 'span'}
                disabled={editIntroBtn}
                html={work || (instagram && !editIntroBtn ? instagram : '')}
                style={{ maxHeight: '70px', overflowY: 'auto', width: '250px' }}
                onChange={(event) => {
                  if (type === 'basic') {
                    setEditableInputs?.({ ...editableInputs, work: event.target.value });
                  } else {
                    setEditableSocialInputs?.({ ...editableSocialInputs, instagram: event.target.value });
                  }
                }}
              />
            </div>
          </div>
          <div className="side-container-body">
            <div className="side-container-body-icon">
              <FaGraduationCap className="icon" />
            </div>
            <div className="side-container-body-content" data-testid="content-1">
              {type === 'basic' && editIntroBtn && school && <>Went to</>}
              {type === 'basic' && editIntroBtn && !school && <div className="no-information">{schoolMsg}</div>}
              {type !== 'basic' && editIntroBtn && twitter && (
                <a className="link" href={twitter} target="_blank" rel="noreferrer noopener">
                  {twitter}
                </a>
              )}
              {type !== 'basic' && editIntroBtn && !twitter && <div className="no-information">{twitterMsg}</div>}
              <ContentEditable
                data-testid="content-2-editable"
                data-placeholder={type === 'basic' ? schoolPlacehoder : twitterPlacehoder}
                tagName={!editIntroBtn ? 'div' : 'span'}
                disabled={editIntroBtn}
                html={school || (twitter && !editIntroBtn ? twitter : '')}
                style={{ maxHeight: '70px', overflowY: 'auto' }}
                onChange={(event) => {
                  if (type === 'basic') {
                    setEditableInputs?.({ ...editableInputs, school: event.target.value });
                  } else {
                    setEditableSocialInputs?.({ ...editableSocialInputs, twitter: event.target.value });
                  }
                }}
              />
            </div>
          </div>
          <div className="side-container-body">
            <div className="side-container-body-icon">
              <FaMapMarkerAlt className="icon" />
            </div>
            <div className="side-container-body-content" data-testid="content-1">
              {type === 'basic' && editIntroBtn && location && <>Lives in</>}
              {type === 'basic' && editIntroBtn && !location && <div className="no-information">{locationMsg}</div>}
              {type !== 'basic' && editIntroBtn && facebook && (
                <a className="link" href={facebook} target="_blank" rel="noreferrer noopener">
                  {facebook}
                </a>
              )}
              {type !== 'basic' && editIntroBtn && !facebook && <div className="no-information">{facebookMsg}</div>}
              <ContentEditable
                data-testid="content-3-editable"
                data-placeholder={type === 'basic' ? locationPlacehoder : facebookPlacehoder}
                tagName={!editIntroBtn ? 'div' : 'span'}
                disabled={editIntroBtn}
                html={location || (facebook && !editIntroBtn ? facebook : '')}
                style={{ maxHeight: '70px', overflowY: 'auto' }}
                onChange={(event) => {
                  if (type === 'basic') {
                    setEditableInputs?.({ ...editableInputs, location: event.target.value });
                  } else {
                    setEditableSocialInputs?.({ ...editableSocialInputs, facebook: event.target.value });
                  }
                }}
              />
            </div>
          </div>
        </>
      )}
      {type === 'social' && (
        <>
          <div className="side-container-body">
            <div className="side-container-body-icon">
              <FaInstagram className="icon instagram" />
            </div>
            <div className="side-container-body-content" data-testid="content-1">
              {editIntroBtn && instagram && (
                <a className="link" href={instagram} target="_blank" rel="noreferrer noopener">
                  {instagram}
                </a>
              )}
              {editIntroBtn && !instagram && <div className="no-information">{instagramMsg}</div>}
              <ContentEditable
                data-testid="content-1-editable"
                data-placeholder={instagramPlacehoder}
                tagName={!editIntroBtn ? 'div' : 'span'}
                disabled={editIntroBtn}
                html={instagram || ''}
                style={{ maxHeight: '70px', overflowY: 'auto' }}
                onChange={(event) => {
                  setEditableSocialInputs?.({ ...editableSocialInputs, instagram: event.target.value });
                }}
              />
            </div>
          </div>
          <div className="side-container-body">
            <div className="side-container-body-icon">
              <FaTwitter className="icon twitter" />
            </div>
            <div className="side-container-body-content" data-testid="content-1">
              {editIntroBtn && twitter && (
                <a className="link" href={twitter} target="_blank" rel="noreferrer noopener">
                  {twitter}
                </a>
              )}
              {editIntroBtn && !twitter && <div className="no-information">{twitterMsg}</div>}
              <ContentEditable
                data-testid="content-2-editable"
                data-placeholder={twitterPlacehoder}
                tagName={!editIntroBtn ? 'div' : 'span'}
                disabled={editIntroBtn}
                html={twitter || ''}
                style={{ maxHeight: '70px', overflowY: 'auto' }}
                onChange={(event) => {
                  setEditableSocialInputs?.({ ...editableSocialInputs, twitter: event.target.value });
                }}
              />
            </div>
          </div>
          <div className="side-container-body">
            <div className="side-container-body-icon">
              <FaFacebook className="icon facebook" />
            </div>
            <div className="side-container-body-content" data-testid="content-1">
              {editIntroBtn && facebook && (
                <a className="link" href={facebook} target="_blank" rel="noreferrer noopener">
                  {facebook}
                </a>
              )}
              {editIntroBtn && !facebook && <div className="no-information">{facebookMsg}</div>}
              <ContentEditable
                data-testid="content-3-editable"
                data-placeholder={facebookPlacehoder}
                tagName={!editIntroBtn ? 'div' : 'span'}
                disabled={editIntroBtn}
                html={facebook || ''}
                style={{ maxHeight: '70px', overflowY: 'auto' }}
                onChange={(event) => {
                  setEditableSocialInputs?.({ ...editableSocialInputs, facebook: event.target.value });
                }}
              />
            </div>
          </div>
          <div className="side-container-body">
            <div className="side-container-body-icon">
              <FaYoutube className="icon youtube" />
            </div>
            <div className="side-container-body-content" data-testid="content-1">
              {editIntroBtn && youtube && (
                <a className="link" href={youtube} target="_blank" rel="noreferrer noopener">
                  {youtube}
                </a>
              )}
              {editIntroBtn && !youtube && <div className="no-information">{youtubeMsg}</div>}
              <ContentEditable
                data-testid="content-4-editable"
                data-placeholder={youtubePlacehoder}
                tagName={!editIntroBtn ? 'div' : 'span'}
                disabled={editIntroBtn}
                html={youtube || ''}
                style={{ maxHeight: '70px', overflowY: 'auto' }}
                onChange={(event) => {
                  setEditableSocialInputs?.({ ...editableSocialInputs, youtube: event.target.value });
                }}
              />
            </div>
          </div>
        </>
      )}
      {isCurrentUser && (
        <div className="intro-submit-button">
          <Button
            label="Update"
            className="button updateBtn"
            disabled={editIntroBtn}
            handleClick={() => {
              setEditIntroBtn(true);
              updateInfo?.();
            }}
          />
        </div>
      )}
        </div>
      )}
    </>
  );
};

InfoDisplay.propTypes = {
  title: PropTypes.string,
  type: PropTypes.string,
  isCurrentUser: PropTypes.bool,
  noBasicInfo: PropTypes.object,
  noSocialInfo: PropTypes.object,
  basicInfoPlaceholder: PropTypes.object,
  socialLinksPlaceholder: PropTypes.object,
  editableInputs: PropTypes.object,
  editableSocialInputs: PropTypes.object,
  loading: PropTypes.bool,
  setEditableInputs: PropTypes.func,
  setEditableSocialInputs: PropTypes.func,
  updateInfo: PropTypes.func
};

export default InfoDisplay;

