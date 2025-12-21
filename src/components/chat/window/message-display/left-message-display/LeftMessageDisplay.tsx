import PropTypes from 'prop-types';
import Avatar from '@components/avatar/Avatar';
import Reactions from '@components/posts/reactions/Reactions';
import { reactionsMap } from '@services/utils/static.data';
import { timeAgo } from '@services/utils/timeago.utils';
import { Utils } from '@services/utils/utils.service';
import './LeftMessageDisplay.scss';

interface LeftMessageDisplayProps {
  chat?: {
    _id?: string;
    conversationId?: string;
    deleteForMe?: boolean;
    deleteForEveryone?: boolean;
    senderUsername?: string;
    senderAvatarColor?: string;
    senderProfilePicture?: string;
    receiverUsername?: string;
    body?: string;
    selectedImage?: string;
    gifUrl?: string;
    reaction?: Array<{
      senderName?: string;
      type?: string;
      [key: string]: unknown;
    }>;
    createdAt?: string | Date;
    [key: string]: unknown;
  };
  profile?: {
    username?: string;
    [key: string]: unknown;
  };
  toggleReaction?: boolean;
  index?: number;
  activeElementIndex?: number;
  reactionRef?: React.RefObject<HTMLDivElement>;
  setToggleReaction?: (value: boolean) => void;
  handleReactionClick?: (body: unknown) => void;
  deleteMessage?: (chat: unknown, type: string) => void;
  showReactionIconOnHover?: (show: boolean, index: number) => void;
  setActiveElementIndex?: (index: number) => void;
  showReactionIcon?: boolean;
  setSelectedReaction?: (body: unknown) => void;
  setShowImageModal?: (show: boolean) => void;
  setImageUrl?: (url: string) => void;
  showImageModal?: boolean;
}

const LeftMessageDisplay = ({
  chat,
  profile,
  toggleReaction,
  showReactionIcon,
  index,
  activeElementIndex,
  reactionRef,
  setToggleReaction,
  handleReactionClick,
  deleteMessage,
  showReactionIconOnHover,
  setActiveElementIndex,
  setSelectedReaction,
  setShowImageModal,
  setImageUrl,
  showImageModal
}: LeftMessageDisplayProps) => {
  return (
    <div className="message left-message" data-testid="left-message">
      <div className="left-message-bubble-container">
        <div className="message-img">
          <Avatar
            name={chat?.senderUsername}
            bgColor={chat?.senderAvatarColor}
            textColor="#ffffff"
            size={40}
            avatarSrc={chat?.senderProfilePicture}
          />
        </div>
        <div className="message-content-container">
          <div className="message-reactions-container">
            {toggleReaction && index === activeElementIndex && (
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
          <div className="message-content-container-wrapper">
            <div
              className="message-content"
              onClick={() => {
                if (!chat?.deleteForMe) {
                  deleteMessage?.(chat, 'deleteForMe');
                }
              }}
              onMouseEnter={() => {
                if (!chat?.deleteForMe) {
                  showReactionIconOnHover?.(true, index || 0);
                  setActiveElementIndex?.(index || 0);
                }
              }}
            >
              {chat?.deleteForMe && chat?.receiverUsername === profile?.username && (
                <div className="message-bubble left-message-bubble">
                  <span className="message-deleted">message deleted</span>
                </div>
              )}

              {!chat?.deleteForMe && (
                <>
                  {chat?.body !== 'Sent a GIF' && chat?.body !== 'Sent an Image' && chat?.body && (
                    <div className="message-bubble left-message-bubble">{chat?.body}</div>
                  )}
                  {chat?.selectedImage && (() => {
                    // Handle both base64 data URLs and Cloudinary URLs
                    const imageUrl = chat.selectedImage as string;
                    let fixedImageUrl = '';
                    if (imageUrl.startsWith('data:')) {
                      // If it's a base64 data URL, use it directly (shouldn't happen from backend, but handle it)
                      fixedImageUrl = imageUrl;
                    } else {
                      // Fix Cloudinary URL typos and malformations
                      fixedImageUrl = Utils.fixCloudinaryUrl(imageUrl);
                    }
                    return fixedImageUrl ? (
                      <div
                        className="message-image"
                        style={{
                          marginTop: `${chat?.body && chat?.body !== 'Sent an Image' ? '5px' : ''}`
                        }}
                      >
                        <img
                          src={fixedImageUrl}
                          onError={(e) => {
                            const fullUrl = e.currentTarget.src;
                            console.error('❌ Failed to load chat image');
                            console.error('   Attempted URL:', fullUrl);
                            console.error('   URL length:', fullUrl.length);
                            if (chat?.selectedImage && chat.selectedImage !== fullUrl) {
                              console.error('   Original URL:', chat.selectedImage);
                              console.error('   Original URL length:', chat.selectedImage.length);
                            }
                            if (fullUrl.length < 100 || fullUrl.includes('…')) {
                              console.error('   ⚠️ URL appears to be truncated or incomplete');
                            }
                            e.currentTarget.style.display = 'none';
                          }}
                          onClick={() => {
                            setImageUrl?.(fixedImageUrl);
                            setShowImageModal?.(!showImageModal);
                          }}
                          alt=""
                        />
                      </div>
                    ) : null;
                  })()}
                  {chat?.gifUrl && (() => {
                    // Handle both base64 data URLs and Cloudinary URLs
                    const gifUrl = chat.gifUrl as string;
                    let fixedGifUrl = '';
                    if (gifUrl.startsWith('data:')) {
                      fixedGifUrl = gifUrl;
                    } else {
                      fixedGifUrl = Utils.fixCloudinaryUrl(gifUrl);
                    }
                    return fixedGifUrl ? (
                      <div className="message-gif">
                        <img 
                          src={fixedGifUrl} 
                          onError={(e) => {
                            const fullUrl = e.currentTarget.src;
                            console.error('❌ Failed to load chat GIF');
                            console.error('   Attempted URL:', fullUrl);
                            console.error('   URL length:', fullUrl.length);
                            if (chat?.gifUrl && chat.gifUrl !== fullUrl) {
                              console.error('   Original URL:', chat.gifUrl);
                              console.error('   Original URL length:', chat.gifUrl.length);
                            }
                            if (fullUrl.length < 100 || fullUrl.includes('…')) {
                              console.error('   ⚠️ URL appears to be truncated or incomplete');
                            }
                            e.currentTarget.style.display = 'none';
                          }}
                          onClick={() => {
                            setImageUrl?.(fixedGifUrl);
                            setShowImageModal?.(!showImageModal);
                          }}
                          alt="" 
                        />
                      </div>
                    ) : null;
                  })()}
                </>
              )}
            </div>
            {showReactionIcon && index === activeElementIndex && !chat?.deleteForMe && (
              <div 
                className="message-content-emoji-container" 
                onClick={(e) => {
                  e.stopPropagation();
                  setToggleReaction?.(true);
                }}
              >
                &#9786;
              </div>
            )}
          </div>
          {chat?.reaction && chat.reaction.length > 0 && !chat?.deleteForMe && (
            <div className="message-reaction">
              {chat?.reaction.map((data, reactionIndex) => (
                <img
                  src={reactionsMap[data?.type as string] || ''}
                  alt=""
                  key={reactionIndex}
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
            <span data-testid="chat-time">{timeAgo.timeFormat(chat?.createdAt || '')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

LeftMessageDisplay.propTypes = {
  chat: PropTypes.object,
  profile: PropTypes.object,
  reactionRef: PropTypes.any,
  toggleReaction: PropTypes.bool,
  showReactionIcon: PropTypes.bool,
  index: PropTypes.number,
  activeElementIndex: PropTypes.number,
  setToggleReaction: PropTypes.func,
  handleReactionClick: PropTypes.func,
  deleteMessage: PropTypes.func,
  showReactionIconOnHover: PropTypes.func,
  setActiveElementIndex: PropTypes.func,
  setSelectedReaction: PropTypes.func,
  setShowImageModal: PropTypes.func,
  showImageModal: PropTypes.bool,
  setImageUrl: PropTypes.func
};

export default LeftMessageDisplay;


