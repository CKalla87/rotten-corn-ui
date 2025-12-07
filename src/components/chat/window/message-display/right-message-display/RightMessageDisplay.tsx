import PropTypes from 'prop-types';
import Reactions from '@components/posts/reactions/Reactions';
import RightMessageBubble from './RightMessageBubble';
import doubleCheckmark from '@assets/images/double-checkmark.png';
import { timeAgo } from '@services/utils/timeago.utils';
import { reactionsMap } from '@services/utils/static.data';
import './RightMessageDisplay.scss';

interface RightMessageDisplayProps {
  chat?: {
    _id?: string;
    conversationId?: string;
    deleteForEveryone?: boolean;
    deleteForMe?: boolean;
    senderUsername?: string;
    reaction?: Array<{
      senderName?: string;
      type?: string;
      [key: string]: unknown;
    }>;
    createdAt?: string | Date;
    isRead?: boolean;
    [key: string]: unknown;
  };
  lastChatMessage?: {
    isRead?: boolean;
    [key: string]: unknown;
  };
  profile?: {
    username?: string;
    [key: string]: unknown;
  };
  togglReaction?: boolean;
  index?: number;
  activeElementIndex?: number;
  activeElementRef?: React.RefObject<HTMLDivElement>;
  reactionRef?: React.RefObject<HTMLDivElement>;
  setToggleReaction?: (value: boolean) => void;
  handleReactionClick?: (body: unknown) => void;
  deleteMessage?: (chat: unknown, type: string) => void;
  showReactionIconOnHover?: (show: boolean, index: number) => void;
  setActiveElementIndex?: (index: number) => void;
  showReactionIcon?: boolean;
  setSelectedReaction?: (body: unknown) => void;
  setShowImageModal?: (show: boolean) => void;
  showImageModal?: boolean;
  setImageUrl?: (url: string) => void;
}

const RightMessageDisplay = ({
  chat,
  lastChatMessage,
  profile,
  togglReaction,
  index,
  activeElementIndex,
  activeElementRef,
  reactionRef,
  setToggleReaction,
  handleReactionClick,
  deleteMessage,
  showReactionIconOnHover,
  setActiveElementIndex,
  showReactionIcon,
  setSelectedReaction,
  setShowImageModal,
  showImageModal,
  setImageUrl
}: RightMessageDisplayProps) => {
  return (
    <div className="message right-message" data-testid="right-message">
      <div className="message-right-reactions-container">
        {togglReaction && index === activeElementIndex && !chat?.deleteForEveryone && (
          <div ref={reactionRef}>
            <Reactions
              showLabel={false}
              handleClick={(event: string) => {
                const body = {
                  conversationId: chat?.conversationId,
                  messageId: chat?._id,
                  reaction: event,
                  type: 'add'
                };
                handleReactionClick?.(body);
                setToggleReaction?.(false);
              }}
            />
          </div>
        )}
      </div>
      <div className="message-right-content-container-wrapper">
        <div
          data-testid="message-content"
          className="message-content"
          onClick={() => {
            if (!chat?.deleteForEveryone) {
              deleteMessage?.(chat, 'deleteForEveryone');
            }
          }}
          onMouseEnter={() => {
            if (!chat?.deleteForEveryone) {
              showReactionIconOnHover?.(true, index || 0);
              setActiveElementIndex?.(index || 0);
            }
          }}
        >
          {chat?.deleteForEveryone && chat?.deleteForMe && (
            <div className="message-bubble right-message-bubble">
              <span className="message-deleted">message deleted</span>
            </div>
          )}
          {!chat?.deleteForEveryone && chat?.deleteForMe && chat?.senderUsername === profile?.username && (
            <div className="message-bubble right-message-bubble">
              <span className="message-deleted">message deleted</span>
            </div>
          )}
          {!chat?.deleteForEveryone && !chat?.deleteForMe && (
            <RightMessageBubble
              chat={chat}
              showImageModal={showImageModal}
              setImageUrl={setImageUrl}
              setShowImageModal={setShowImageModal}
            />
          )}
          {showReactionIcon && index === activeElementIndex && !chat?.deleteForEveryone && (
            <div className="message-content-emoji-right-container" onClick={() => setToggleReaction?.(true)}>
              &#9786;
            </div>
          )}
        </div>
        <div className="message-content-bottom">
          {chat?.reaction && chat?.reaction.length > 0 && !chat?.deleteForEveryone && (
            <div className="message-reaction">
              {chat?.reaction.map((data, index) => (
                <img
                  key={index}
                  data-testid="reaction-img"
                  src={reactionsMap[data?.type as string] || ''}
                  alt=""
                  onClick={() => {
                    if (data?.senderName === profile?.username) {
                      const body = {
                        conversationId: chat?.conversationId,
                        messageId: chat?._id,
                        reaction: data?.type,
                        type: 'remove'
                      };
                      setSelectedReaction?.(body);
                    }
                  }}
                />
              ))}
            </div>
          )}
          <div className="message-time">
            {chat?.senderUsername === profile?.username && !chat?.deleteForEveryone && (
              <>
                {lastChatMessage?.isRead ? (
                  <img src={doubleCheckmark} alt="" className="message-read-icon" />
                ) : (
                  <>
                    {chat?.isRead && <img src={doubleCheckmark} alt="" className="message-read-icon" />}
                  </>
                )}
              </>
            )}
            <span data-testid="chat-time">{timeAgo.timeFormat(chat?.createdAt || '')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

RightMessageDisplay.propTypes = {
  chat: PropTypes.object,
  lastChatMessage: PropTypes.object,
  profile: PropTypes.object,
  reactionRef: PropTypes.any,
  togglReaction: PropTypes.bool,
  showReactionIcon: PropTypes.bool,
  index: PropTypes.number,
  activeElementIndex: PropTypes.number,
  activeElementRef: PropTypes.object,
  setToggleReaction: PropTypes.func,
  handleReactionClick: PropTypes.func,
  deleteMessage: PropTypes.func,
  showReactionIconOnHover: PropTypes.func,
  setActiveElementIndex: PropTypes.func,
  setSelectedReaction: PropTypes.func,
  setShowImageModal: PropTypes.func,
  showImageModal: PropTypes.func,
  setImageUrl: PropTypes.func
};

export default RightMessageDisplay;

