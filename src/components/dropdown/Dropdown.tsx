import Avatar from '@components/avatar/Avatar';
import Button from '@components/button/Button';
import { FaCircle, FaTrashAlt, FaUserAlt } from 'react-icons/fa';
import { timeAgo } from '@services/utils/timeago.utils';
import { Utils } from '@services/utils/utils.service';
import './Dropdown.scss';

interface DropdownItem {
  _id?: string;
  topText?: string;
  subText?: string;
  createdAt?: string;
  username?: string;
  avatarColor?: string;
  profilePicture?: string;
  read?: boolean;
  post?: string;
  imgUrl?: string;
  comment?: string;
  reaction?: string;
  senderName?: string;
  notificationType?: string;
  [key: string]: unknown;
}

interface DropdownProps {
  data: DropdownItem[];
  notificationCount?: number;
  title: string;
  style?: React.CSSProperties;
  height?: number;
  onMarkAsRead?: (item: DropdownItem) => void;
  onDeleteNotification?: (id: string) => void;
  onLogout?: () => void;
  onNavigate?: () => void;
}

const Dropdown = ({
  data,
  notificationCount = 0,
  title,
  style,
  height = 300,
  onMarkAsRead,
  onDeleteNotification,
  onLogout,
  onNavigate
}: DropdownProps) => {
  // Format notification message with more context - same logic as notifications page
  const formatNotificationMessage = (item: DropdownItem): string => {
    const userFrom = item?.userFrom as { username?: string; avatarColor?: string; profilePicture?: string } | undefined;
    const username = userFrom?.username || item?.username || item?.senderName || 'Someone';
    const notificationType = item?.notificationType;
    const message = item?.message || item?.description || item?.topText;
    
    // If we have a custom message, use it (same as notifications page)
    if (message) {
      return message as string;
    }
    
    // Otherwise format based on notification type (same as notifications page)
    switch (notificationType) {
      case 'follows':
        return `${username} is now following you.`;
      case 'comments':
        const comment = item?.comment as string | undefined;
        return comment ? `${username} commented: "${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}"` : `${username} commented on your post`;
      case 'reactions':
        const reaction = item?.reaction as string | undefined;
        const reactionEmoji: Record<string, string> = {
          love: '❤️',
          like: '👍',
          haha: '😄',
          angry: '😠',
          sad: '😢',
          wow: '😲'
        };
        const reactionText = reaction ? (reactionEmoji[reaction] || reaction) : 'reacted';
        return `${username} ${reactionText} your post`;
      default:
        return `${username} interacted with you`;
    }
  };

  return (
    <div className="social-dropdown" style={style} data-testid="dropdown">
      <div className="social-card">
        <div className="social-card-body">
          <div className="social-bg-primary">
            <h5>
              {title}
              {title === 'Notifications' && notificationCount > 0 && (
                <span className="social-count">{notificationCount}</span>
              )}
            </h5>
          </div>

          <div className="social-card-body-info">
            <div
              data-testid="info-container"
              className="social-card-body-info-container"
              style={{ maxHeight: `${height}px` }}
            >
              {data.map((item) => {
                const userFrom = item?.userFrom as { username?: string; avatarColor?: string; profilePicture?: string } | undefined;
                // Use same logic as notifications page: userFrom first, then fallbacks
                const username = userFrom?.username || item?.username || item?.senderName;
                const avatarColor = userFrom?.avatarColor || item?.avatarColor;
                const profilePicture = userFrom?.profilePicture || item?.profilePicture;
                
                return (
                  <div className="social-sub-card" key={Utils.generateString(10)}>
                    <div className="content-avatar">
                      {title === 'Notifications' ? (
                        <Avatar
                          name={username}
                          bgColor={avatarColor}
                          textColor="#ffffff"
                          size={40}
                          avatarSrc={profilePicture ? Utils.fixCloudinaryUrl(profilePicture as string) : undefined}
                        />
                      ) : (
                        <FaUserAlt className="userIcon" />
                      )}
                    </div>
                    <div
                      className="content-body"
                      onClick={() => {
                        if (title === 'Notifications') {
                          onMarkAsRead?.(item);
                        } else {
                          onNavigate?.();
                        }
                      }}
                    >
                      <h6 className="title">{title === 'Notifications' ? formatNotificationMessage(item) : item?.topText}</h6>
                      <div className="subtitle-body">
                        {title === 'Notifications' && !item?.read && <FaCircle className="icon unread-indicator" />}
                        <p className="subtext">{item?.createdAt && title === 'Notifications' ? timeAgo.transform(item.createdAt) : item?.subText}</p>
                      </div>
                    </div>
                    {title === 'Notifications' && (
                      <div className="content-icons">
                        <FaTrashAlt 
                          className="trash" 
                          onClick={(e) => { e.stopPropagation(); onDeleteNotification?.(item?._id || ''); }} 
                        />
                        {!item?.read && <FaCircle className="icon unread-indicator-right" />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {title === 'Settings' && (
              <div className="social-sub-button">
                <Button label="Sign out" className="button signOut" handleClick={onLogout} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dropdown;

