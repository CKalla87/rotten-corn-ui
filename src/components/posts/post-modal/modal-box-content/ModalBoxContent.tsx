import { useRef, useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { find } from 'lodash';
import { FaGlobe } from 'react-icons/fa';
import Avatar from '@components/avatar/Avatar';
import SelectDropdown from '@components/select-dropdown/SelectDropdown';
import useDetectOutsideClick from '@hooks/useDetectOutsideClick';
import { privacyList, feelingsList } from '@services/utils/static.data';
import type { RootState } from '@redux/store';
import type { PrivacyItem, FeelingItem } from '@services/utils/static.data';
import './ModalBoxContent.scss';

const ModalBoxContent = () => {
  const { profile } = useSelector((state: RootState) => state.user);
  const { privacy } = useSelector((state: RootState) => state.post);
  const { feeling } = useSelector((state: RootState) => state.modal);
  const privacyRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<PrivacyItem>({
    topText: 'Public',
    subText: 'Anyone on SocialApp',
    icon: <FaGlobe className="globe-icon globe" />
  });
  const [tooglePrivacy, setTogglePrivacy] = useDetectOutsideClick(privacyRef, false);

  const displayPostPrivacy = useCallback(() => {
    if (privacy) {
      const postPrivacy = find(privacyList, (data) => data.topText === privacy);
      if (postPrivacy) {
        setSelectedItem(postPrivacy);
      }
    }
  }, [privacy]);

  useEffect(() => {
    displayPostPrivacy();
  }, [displayPostPrivacy]);

  const feelingData: FeelingItem | undefined = feeling
    ? feelingsList.find((item) => item.name === feeling)
    : undefined;

  return (
    <div className="modal-box-content" data-testid="modal-box-content">
      <div className="user-post-image" data-testid="box-avatar">
        <Avatar
          name={profile?.username}
          bgColor={profile?.avatarColor}
          textColor="#ffffff"
          size={40}
          avatarSrc={profile?.profilePicture}
        />
      </div>
      <div className="modal-box-info">
        <h5 className="inline-title-display" data-testid="box-username">
          {profile?.username || 'Danny'}
        </h5>
        {feelingData?.name && (
          <p className="inline-display" data-testid="box-feeling">
            is feeling <img className="feeling-icon" src={feelingData.image} alt="" />{' '}
            <span>{feelingData.name}</span>
          </p>
        )}
        <div data-testid="box-text-display" className="time-text-display">
          <div className="selected-item-text" data-testid="box-item-text">
            {feelingData?.name ? 'Feeling' : ''}
          </div>
          <div 
            ref={privacyRef} 
            onClick={(e) => {
              e.stopPropagation();
              setTogglePrivacy(!tooglePrivacy);
            }}
            style={{ userSelect: 'none' }}
          >
            <div 
              className="privacy-item" 
              data-testid="privacy-item"
              contentEditable={false}
              suppressContentEditableWarning
            >
              {selectedItem.icon}
              <span>{selectedItem.topText}</span>
              <span>{selectedItem.subText}</span>
            </div>
            {tooglePrivacy && (
              <SelectDropdown
                isActive={tooglePrivacy}
                setSelectedItem={setSelectedItem}
                items={privacyList}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalBoxContent;

