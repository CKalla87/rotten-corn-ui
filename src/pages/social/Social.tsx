import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '@components/header/Header';
import Sidebar from '@components/sidebar/Sidebar';
import type { RootState } from '@redux/store';
import './Social.scss';

const Social = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { selectedChatUser } = useSelector((state: RootState) => state.chat);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Close sidebar when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    if (window.innerWidth <= 768) {
      closeSidebar();
    }
  }, [location.pathname]);

  const isChatRoute = location.pathname.includes('/chat');
  const isChatListPage = isChatRoute && !selectedChatUser;
  const shouldHideHeader = isChatRoute && (selectedChatUser || isChatListPage);

  return (
    <>
      <div className={shouldHideHeader ? 'header-hidden-on-chat' : ''}>
        <Header onMenuToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      </div>
      <div className={`dashboard ${shouldHideHeader ? 'dashboard-no-header-on-chat' : ''}`}>
        <div className={`dashboard-overlay ${isSidebarOpen ? 'overlay-open' : ''}`} onClick={closeSidebar}></div>
        <div className={`dashboard-sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
          <Sidebar onNavigate={closeSidebar} />
        </div>
        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default Social;

