import { useState } from 'react';
import { useLocation, useNavigate, createSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { sideBarItems, fontAwesomeIcons } from '@services/utils/static.data';
import type { RootState } from '@redux/store';
import './Sidebar.scss';

const Sidebar = () => {
  const { profile } = useSelector((state: RootState) => state.user);
  const [sidebar] = useState<typeof sideBarItems>(sideBarItems);
  const location = useLocation();
  const navigate = useNavigate();

  const checkUrl = (name: string) => {
    return location.pathname.includes(name.toLowerCase());
  };

  const navigateToPage = (name: string, url: string) => {
    if (name === 'Profile') {
      const params: Record<string, string> = {};
      if (profile?._id && typeof profile._id === 'string') {
        params.id = profile._id;
      }
      if (profile?.uId && typeof profile.uId === 'string') {
        params.uId = profile.uId;
      }
      url = `${url}/${profile?.username}?${createSearchParams(params)}`;
    }
    navigate(url);
  };

  return (
    <div className="app-side-menu">
      <div className="side-menu">
        <ul className="list-unstyled">
          {sidebar.map((data) => (
            <li key={data.index} onClick={() => navigateToPage(data.name, data.url)}>
              <div data-testid="sidebar-list" className={`sidebar-link ${checkUrl(data.name) ? 'active' : ''}`}>
                <div className="menu-icon">{fontAwesomeIcons[data.iconName]}</div>
                <div className="menu-link">
                  <span>{`${data.name}`}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;

