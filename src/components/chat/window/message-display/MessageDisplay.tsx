import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { RightMessageDisplay } from './right-message-display';
import { LeftMessageDisplay } from './left-message-display';
import ImageModal from '@components/image-modal/ImageModal';
import Dialog from '@components/dialog/Dialog';
import TypingIndicator from '@components/chat/typing-indicator/TypingIndicator';
import useDetectOutsideClick from '@hooks/useDetectOutsideClick';
import useChatScrollToBottom from '@hooks/useChatScrollToBottom';
import { timeAgo } from '@services/utils/timeago.utils';
import { Utils } from '@services/utils/utils.service';
import './MessageDisplay.scss';

interface MessageDisplayProps {
  chatMessages?: Array<{
    _id?: string;
    conversationId?: string;
    receiverUsername?: string;
    senderUsername?: string;
    createdAt?: string | Date;
    [key: string]: unknown;
  }>;
  profile?: {
    username?: string;
    [key: string]: unknown;
  };
  updateMessageReaction?: (body: unknown) => void;
  deleteChatMessage?: (senderId: string, receiverId: string, messageId: string, type: string) => void;
  typingUsers?: string[];
  receiver?: {
    username?: string;
    [key: string]: unknown;
  };
}

const MessageDisplay = ({ chatMessages = [], profile, updateMessageReaction, deleteChatMessage, typingUsers = [] }: MessageDisplayProps) => {
  const [imageUrl, setImageUrl] = useState('');
  const [showReactionIcon, setShowReactionIcon] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; message: unknown; type: string }>({
    open: false,
    message: null,
    type: ''
  });
  const [activeElementIndex, setActiveElementIndex] = useState<number | null>(null);
  const [selectedReaction, setSelectedReaction] = useState<unknown>(null);
  const reactionRef = useRef<HTMLDivElement>(null);
  const [toggleReaction, setToggleReaction] = useDetectOutsideClick(reactionRef, false);
  const scrollRef = useChatScrollToBottom(chatMessages);

  const showReactionIconOnHover = (show: boolean, index: number) => {
    // Close reaction picker if hovering over a different message
    if (show && activeElementIndex !== null && activeElementIndex !== index) {
      setToggleReaction(false);
    }
    if (index === activeElementIndex || !activeElementIndex) {
      setShowReactionIcon(show);
    }
  };

  const handleReactionClick = (body: unknown) => {
    updateMessageReaction?.(body);
    setSelectedReaction(null);
  };

  const deleteMessage = (message: unknown, type: string) => {
    setDeleteDialog({
      open: true,
      message,
      type
    });
  };

  return (
    <>
      {showImageModal && (
        <ImageModal image={imageUrl} onCancel={() => setShowImageModal(!showImageModal)} showArrow={false} />
      )}
      {selectedReaction && (
        <Dialog
          title="Do you want to remove your reaction?"
          firstButtonText="Remove"
          secondButtonText="Cancel"
          firstBtnHandler={() => handleReactionClick(selectedReaction)}
          secondBtnHandler={() => setSelectedReaction(null)}
        />
      )}
      {deleteDialog.open && (
        <Dialog
          title="Delete message?"
          firstButtonText={deleteDialog.type === 'deleteForMe' ? 'DELETE FOR ME' : 'DELETE FOR EVERYONE'}
          secondButtonText="CANCEL"
          firstBtnHandler={() => {
            const { message, type } = deleteDialog;
            if (deleteChatMessage && message) {
              const msg = message as {
                senderId?: string;
                receiverId?: string;
                _id?: string;
                [key: string]: unknown;
              };
              deleteChatMessage(msg.senderId || '', msg.receiverId || '', msg._id || '', type);
            }
            setDeleteDialog({ open: false, message: null, type: '' });
          }}
          secondBtnHandler={() => setDeleteDialog({ open: false, message: null, type: '' })}
        />
      )}
      <div className="message-page" ref={scrollRef} data-testid="message-page">
        {chatMessages.map((chat, index) => (
          <div key={Utils.generateString(10)} className="message-chat" data-testid="message-chat">
            {(index === 0 ||
              timeAgo.dayMonthYear(chat.createdAt || '') !== timeAgo.dayMonthYear(chatMessages[index - 1]?.createdAt || '')) && (
              <div className="message-date-group">
                <div className="message-chat-date" data-testid="message-chat-date">
                  {timeAgo.chatMessageTransform(chat.createdAt || '')}
                </div>
              </div>
            )}
            {(chat.receiverUsername === profile?.username || chat.senderUsername === profile?.username) && (
              <>
                {chat.senderUsername === profile?.username && (
                  <RightMessageDisplay
                    chat={chat}
                    lastChatMessage={chatMessages[chatMessages.length - 1]}
                    profile={profile}
                    togglReaction={toggleReaction}
                    showReactionIcon={showReactionIcon}
                    index={index}
                    activeElementIndex={activeElementIndex || undefined}
                    reactionRef={reactionRef as React.RefObject<HTMLDivElement>}
                    setToggleReaction={setToggleReaction}
                    handleReactionClick={handleReactionClick}
                    deleteMessage={deleteMessage}
                    showReactionIconOnHover={showReactionIconOnHover}
                    setActiveElementIndex={setActiveElementIndex}
                    setSelectedReaction={setSelectedReaction}
                    setShowImageModal={setShowImageModal}
                    setImageUrl={setImageUrl}
                    showImageModal={showImageModal}
                  />
                )}
                {chat.receiverUsername === profile?.username && (
                  <LeftMessageDisplay
                    chat={chat}
                    profile={profile}
                    toggleReaction={toggleReaction}
                    showReactionIcon={showReactionIcon}
                    index={index}
                    activeElementIndex={activeElementIndex || undefined}
                    reactionRef={reactionRef as React.RefObject<HTMLDivElement>}
                    setToggleReaction={setToggleReaction}
                    handleReactionClick={handleReactionClick}
                    deleteMessage={deleteMessage}
                    showReactionIconOnHover={showReactionIconOnHover}
                    setActiveElementIndex={setActiveElementIndex}
                    setSelectedReaction={setSelectedReaction}
                    setShowImageModal={setShowImageModal}
                    setImageUrl={setImageUrl}
                    showImageModal={showImageModal}
                  />
                )}
              </>
            )}
          </div>
        ))}
        {typingUsers.length > 0 && (
          <div className="message-chat" data-testid="typing-indicator-container">
            {typingUsers.map((username) => (
              <TypingIndicator key={`typing-${username}`} username={username} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

MessageDisplay.propTypes = {
  chatMessages: PropTypes.array,
  profile: PropTypes.object,
  updateMessageReaction: PropTypes.func,
  deleteChatMessage: PropTypes.func,
  typingUsers: PropTypes.array,
  receiver: PropTypes.object
};

export default MessageDisplay;

