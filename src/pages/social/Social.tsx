import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '@components/header/Header';
import Sidebar from '@components/sidebar/Sidebar';
import type { RootState } from '@redux/store';
import './Social.scss';

// Mobile styles for production - injected via JavaScript to bypass CSS caching
const MOBILE_STYLES = `
  @media screen and (max-width: 768px) {
    .dashboard { 
      overflow: visible !important; 
      overflow-x: visible !important; 
      overflow-y: visible !important; 
      height: auto !important; 
    }
    .dashboard-content { 
      overflow: visible !important; 
      overflow-x: visible !important; 
      overflow-y: visible !important; 
      height: auto !important; 
    }
    .streams { 
      overflow: visible !important; 
      width: 100% !important; 
      max-width: 100% !important; 
    }
    .streams-content { 
      overflow: visible !important; 
      width: 100% !important; 
      max-width: 100% !important; 
    }
    .streams-post { 
      overflow: visible !important; 
      width: 100% !important; 
      max-width: 100% !important; 
      height: auto !important; 
    }
    .posts-container { 
      overflow: visible !important; 
      width: 100% !important; 
      max-width: 100% !important; 
      padding: 0 !important; 
      margin: 0 !important; 
      box-sizing: border-box !important; 
    }
    .post-body {
      width: calc(100% - 24px) !important;
      max-width: calc(100% - 24px) !important;
      margin-left: 12px !important;
      margin-right: 12px !important;
      margin-bottom: 12px !important;
      padding: 12px !important;
      border-radius: 8px !important;
      background-color: #1a1a1a !important;
      border: none !important;
    }
    .post-form {
      width: calc(100% - 24px) !important;
      max-width: calc(100% - 24px) !important;
      margin-top: 12px !important;
      margin-left: 12px !important;
      margin-right: 12px !important;
      margin-bottom: 12px !important;
      border-radius: 8px !important;
      height: auto !important;
      min-height: auto !important;
      max-height: none !important;
      box-sizing: border-box !important;
    }
    .image-display-flex {
      width: 100% !important;
      max-width: 100% !important;
    }
    .post-image {
      width: 100% !important;
      max-width: 100% !important;
      object-fit: contain !important;
    }
  }
`;

const Social = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { selectedChatUser } = useSelector((state: RootState) => state.chat);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

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
      // Use setTimeout to avoid calling setState synchronously in effect
      setTimeout(() => {
        setIsSidebarOpen(false);
      }, 0);
    }
  }, [location.pathname]);

  // Inject mobile styles via JavaScript to bypass CSS caching in production
  useEffect(() => {
    // Check if style already exists
    const existingStyle = document.getElementById('mobile-override-styles');
    if (!existingStyle) {
      const styleElement = document.createElement('style');
      styleElement.id = 'mobile-override-styles';
      styleElement.textContent = MOBILE_STYLES;
      document.head.appendChild(styleElement);
    }
    
    // Also apply styles directly to elements as fallback
    const applyMobileStyles = () => {
      if (window.innerWidth <= 768) {
        const dashboard = document.querySelector('.dashboard');
        const dashboardContent = document.querySelector('.dashboard-content');
        const streams = document.querySelector('.streams');
        const streamsContent = document.querySelector('.streams-content');
        const streamsPost = document.querySelector('.streams-post');
        
        if (dashboard) {
          (dashboard as HTMLElement).style.setProperty('overflow', 'visible', 'important');
          (dashboard as HTMLElement).style.setProperty('overflow-x', 'visible', 'important');
          (dashboard as HTMLElement).style.setProperty('overflow-y', 'visible', 'important');
          (dashboard as HTMLElement).style.setProperty('height', 'auto', 'important');
        }
        if (dashboardContent) {
          (dashboardContent as HTMLElement).style.setProperty('overflow', 'visible', 'important');
          (dashboardContent as HTMLElement).style.setProperty('overflow-x', 'visible', 'important');
          (dashboardContent as HTMLElement).style.setProperty('overflow-y', 'visible', 'important');
          (dashboardContent as HTMLElement).style.setProperty('height', 'auto', 'important');
        }
        if (streams) {
          (streams as HTMLElement).style.setProperty('overflow', 'visible', 'important');
          (streams as HTMLElement).style.setProperty('width', '100%', 'important');
          (streams as HTMLElement).style.setProperty('max-width', '100%', 'important');
        }
        if (streamsContent) {
          (streamsContent as HTMLElement).style.setProperty('overflow', 'visible', 'important');
          (streamsContent as HTMLElement).style.setProperty('width', '100%', 'important');
          (streamsContent as HTMLElement).style.setProperty('max-width', '100%', 'important');
          (streamsContent as HTMLElement).style.setProperty('padding', '0', 'important');
          (streamsContent as HTMLElement).style.setProperty('margin', '0', 'important');
          (streamsContent as HTMLElement).style.setProperty('display', 'block', 'important');
        }
        if (streamsPost) {
          (streamsPost as HTMLElement).style.setProperty('overflow', 'visible', 'important');
          (streamsPost as HTMLElement).style.setProperty('width', '100%', 'important');
          (streamsPost as HTMLElement).style.setProperty('max-width', '100%', 'important');
          (streamsPost as HTMLElement).style.setProperty('height', 'auto', 'important');
        }
        // Apply styles to all posts-container elements (in case there are multiple)
        const postsContainers = document.querySelectorAll('.posts-container');
        postsContainers.forEach((container) => {
          (container as HTMLElement).style.setProperty('overflow', 'visible', 'important');
          (container as HTMLElement).style.setProperty('width', '100%', 'important');
          (container as HTMLElement).style.setProperty('max-width', '100%', 'important');
          (container as HTMLElement).style.setProperty('padding', '0', 'important');
          (container as HTMLElement).style.setProperty('margin', '0', 'important');
          (container as HTMLElement).style.setProperty('box-sizing', 'border-box', 'important');
        });
        
        // Apply card styles to all post-body elements
        const postBodies = document.querySelectorAll('.post-body');
        postBodies.forEach((postBody) => {
          (postBody as HTMLElement).style.setProperty('width', 'calc(100% - 24px)', 'important');
          (postBody as HTMLElement).style.setProperty('max-width', 'calc(100% - 24px)', 'important');
          (postBody as HTMLElement).style.setProperty('margin-left', '12px', 'important');
          (postBody as HTMLElement).style.setProperty('margin-right', '12px', 'important');
          (postBody as HTMLElement).style.setProperty('margin-bottom', '12px', 'important');
          (postBody as HTMLElement).style.setProperty('padding', '12px', 'important');
          (postBody as HTMLElement).style.setProperty('border-radius', '8px', 'important');
          (postBody as HTMLElement).style.setProperty('background-color', '#1a1a1a', 'important');
          (postBody as HTMLElement).style.setProperty('border', 'none', 'important');
        });
        
        // Apply matching width and height styles to post-form elements
        const postForms = document.querySelectorAll('.post-form');
        postForms.forEach((postForm) => {
          (postForm as HTMLElement).style.setProperty('width', 'calc(100% - 24px)', 'important');
          (postForm as HTMLElement).style.setProperty('max-width', 'calc(100% - 24px)', 'important');
          (postForm as HTMLElement).style.setProperty('margin-top', '12px', 'important');
          (postForm as HTMLElement).style.setProperty('margin-left', '12px', 'important');
          (postForm as HTMLElement).style.setProperty('margin-right', '12px', 'important');
          (postForm as HTMLElement).style.setProperty('margin-bottom', '12px', 'important');
          (postForm as HTMLElement).style.setProperty('border-radius', '8px', 'important');
          (postForm as HTMLElement).style.setProperty('height', 'auto', 'important');
          (postForm as HTMLElement).style.setProperty('min-height', 'auto', 'important');
          (postForm as HTMLElement).style.setProperty('max-height', 'none', 'important');
          (postForm as HTMLElement).style.setProperty('box-sizing', 'border-box', 'important');
        });
        
        // Apply dropdown positioning to ensure it works in develop environment
        const applyDropdownStyles = () => {
          const dropdowns = document.querySelectorAll('.dropdown-ul.dropdown-ul-notifications, .dropdown-ul.dropdown-ul-settings');
          dropdowns.forEach((dropdown) => {
            (dropdown as HTMLElement).style.setProperty('z-index', '1000', 'important');
            (dropdown as HTMLElement).style.setProperty('width', 'calc(100vw - 40px)', 'important');
            (dropdown as HTMLElement).style.setProperty('max-width', '350px', 'important');
            (dropdown as HTMLElement).style.setProperty('margin-right', '0', 'important');
            (dropdown as HTMLElement).style.setProperty('position', 'fixed', 'important');
            (dropdown as HTMLElement).style.setProperty('top', '5px', 'important');
            (dropdown as HTMLElement).style.setProperty('left', '50%', 'important');
            (dropdown as HTMLElement).style.setProperty('right', 'auto', 'important');
            (dropdown as HTMLElement).style.setProperty('transform', 'translate(-50%)', 'important');
          });
          
          const socialDropdowns = document.querySelectorAll('.social-dropdown');
          socialDropdowns.forEach((dropdown) => {
            (dropdown as HTMLElement).style.setProperty('width', 'calc(100vw - 40px)', 'important');
            (dropdown as HTMLElement).style.setProperty('max-width', '350px', 'important');
            (dropdown as HTMLElement).style.setProperty('max-height', 'calc(100vh - 100px)', 'important');
            (dropdown as HTMLElement).style.setProperty('margin-top', '0', 'important');
            (dropdown as HTMLElement).style.setProperty('position', 'fixed', 'important');
            (dropdown as HTMLElement).style.setProperty('top', '70px', 'important');
            (dropdown as HTMLElement).style.setProperty('left', '50%', 'important');
            (dropdown as HTMLElement).style.setProperty('transform', 'translate(-50%)', 'important');
          });
        };
        
        // Apply dropdown styles immediately
        applyDropdownStyles();
        
        // Watch for new dropdowns being added to the DOM
        const dropdownObserver = new MutationObserver(() => {
          applyDropdownStyles();
        });
        
        dropdownObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        // Store observer for cleanup
        const windowWithObserver = window as Window & { __dropdownObserver?: MutationObserver };
        windowWithObserver.__dropdownObserver = dropdownObserver;
        
      }
    };

    // Apply immediately and on resize
    applyMobileStyles();
    window.addEventListener('resize', applyMobileStyles);
    
    // Also use MutationObserver to apply styles when elements are added to DOM
    const observer = new MutationObserver(() => {
      applyMobileStyles();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('resize', applyMobileStyles);
      observer.disconnect();
      // Cleanup dropdown observer if it exists
      const windowWithObserver = window as Window & { __dropdownObserver?: MutationObserver };
      if (windowWithObserver.__dropdownObserver) {
        windowWithObserver.__dropdownObserver.disconnect();
      }
    };
  }, []);

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

