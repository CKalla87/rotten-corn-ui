import { useRef } from 'react';
import { useDispatch } from 'react-redux';
import { updatePostItem } from '@redux/reducers/post/postSlice';
import type { AppDispatch } from '@redux/store';
import type { PrivacyItem } from '@services/utils/static.data';
import './SelectDropdown.scss';

interface SelectDropdownProps {
  isActive: boolean;
  setSelectedItem: (item: PrivacyItem) => void;
  items?: PrivacyItem[];
}

const SelectDropdown = ({ isActive, setSelectedItem, items = [] }: SelectDropdownProps) => {
  const dropdownRef = useRef<HTMLElement | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  const selectItem = (item: PrivacyItem) => {
    setSelectedItem(item);
    dispatch(updatePostItem({ privacy: item.topText }));
  };

  return (
    <div className="menu-container" data-testid="menu-container">
      <nav ref={dropdownRef} className={`menu ${isActive ? 'active' : 'inactive'}`}>
        <ul>
          {items.map((item, index) => (
            <li
              data-testid="select-dropdown"
              key={index}
              onClick={() => selectItem(item)}
            >
              <div className="menu-icon">{item.icon}</div>
              <div className="menu-text">
                <div className="menu-text-header">{item.topText}</div>
                <div className="sub-header">{item.subText}</div>
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default SelectDropdown;

