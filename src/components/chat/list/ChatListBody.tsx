import PropTypes from 'prop-types';
import { FaCheck, FaCircle } from 'react-icons/fa';
import doubleCheckmark from '@assets/images/double-checkmark.png';
import './ChatListBody.scss';

interface ChatListBodyProps {
  data: {
    body?: string;
    isRead?: boolean;
    receiverUsername?: string;
    senderUsername?: string;
    [key: string]: unknown;
  };
  profile?: {
    username?: string;
    [key: string]: unknown;
  };
}

const ChatListBody = ({ data, profile }: ChatListBodyProps) => {
  return (
    <div className="conversation-message">
      <span>{data.body}</span>
      {!data.isRead ? (
        <>
          {data.receiverUsername === profile?.username ? (
            <FaCircle className="icon" />
          ) : (
            <FaCheck className="icon not-read" />
          )}
        </>
      ) : (
        <>
          {data.senderUsername === profile?.username && (
            <img src={doubleCheckmark} alt="" className="icon read" />
          )}
        </>
      )}
    </div>
  );
};

ChatListBody.propTypes = {
  data: PropTypes.object,
  profile: PropTypes.object
};

export default ChatListBody;

