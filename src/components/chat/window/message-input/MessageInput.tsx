import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import Input from '@components/input/Input';
import Button from '@components/button/Button';
import { FaPaperPlane } from 'react-icons/fa';
import gif from '@assets/images/gif.png';
import photo from '@assets/images/photo.png';
import feeling from '@assets/images/feeling.png';
import loadable from '@loadable/component';
import { GiphyContainer } from '@components/chat/giphy-container';
import { ImagePreview } from '@components/chat/image-preview';
import { ImageUtils } from '@services/utils/image-utils.service';
import { ChatUtils } from '@services/utils/chat-utils.service';
import './MessageInput.scss';

const EmojiPickerComponent = loadable(() => import('./EmojiPicker'), {
  fallback: <p id="loading">Loading...</p>
});

interface MessageInputProps {
  setChatMessage?: (message: string, url?: string, base64File?: string) => void;
  receiver?: {
    username?: string;
    [key: string]: unknown;
  };
  profile?: {
    username?: string;
    [key: string]: unknown;
  };
}

const MessageInput = ({ setChatMessage, receiver, profile }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [showEmojiContainer, setShowEmojiContainer] = useState(false);
  const [showGifContainer, setShowGifContainer] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showGifPreview, setShowGifPreview] = useState(false);
  const [file, setFile] = useState('');
  const [base64File, setBase64File] = useState('');
  const [gifUrl, setGifUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const gifContainerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLLIElement>(null);
  const gifButtonRef = useRef<HTMLLIElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const emitStopTyping = () => {
    if (receiver?.username && profile?.username && isTypingRef.current) {
      ChatUtils.emitStopTypingEvent(receiver.username, profile.username);
      isTypingRef.current = false;
    }
  };

  const emitTyping = () => {
    if (receiver?.username && profile?.username && !isTypingRef.current) {
      ChatUtils.emitTypingEvent(receiver.username, profile.username);
      isTypingRef.current = true;
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping();
    }, 3000);
  };

  const handleClick = (e?: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    // Prevent default form submission
    if (e) {
      e.preventDefault();
    }
    
    // Don't send if there's nothing to send
    if (!message.trim() && !showGifPreview && !showImagePreview) {
      return;
    }
    
    // Stop typing when message is sent
    emitStopTyping();
    
    if (showGifPreview && gifUrl) {
      // Send GIF
      setChatMessage?.(message || 'Sent a GIF', gifUrl, '');
      setMessage('');
      reset();
    } else {
      // Send regular message or image
      const messageToSend = message || 'Sent an Image';
      setChatMessage?.(messageToSend.replace(/ +(?= )/g, ''), '', base64File);
      setMessage('');
      reset();
    }
  };

  const handleGiphyClick = (url: string) => {
    setGifUrl(url);
    setShowGifPreview(true);
    setShowGifContainer(false);
    setShowEmojiContainer(false);
  };

  const addToPreview = async (selectedFile: File | null) => {
    if (!selectedFile) return;
    ImageUtils.checkFile(selectedFile);
    setFile(URL.createObjectURL(selectedFile));
    const result = await ImageUtils.readAsBase64(selectedFile);
    setBase64File(result);
    setShowImagePreview(true);
    setShowEmojiContainer(false);
    setShowGifContainer(false);
  };

  const fileInputClicked = () => {
    fileInputRef.current?.click();
  };

  const reset = () => {
    // Revoke the blob URL to free memory
    if (file) {
      URL.revokeObjectURL(file);
    }
    setFile('');
    setBase64File('');
    setShowImagePreview(false);
    setGifUrl('');
    setShowGifPreview(false);
    // Clear the file input element
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (messageInputRef?.current) {
      messageInputRef.current.focus();
    }
  }, [setChatMessage]);

  // Close emoji and gif containers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside emoji picker (but not on the emoji button)
      if (
        showEmojiContainer &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(target) &&
        !emojiButtonRef.current?.contains(target)
      ) {
        setShowEmojiContainer(false);
      }
      
      // Check if click is outside gif container (but not on the gif button)
      if (
        showGifContainer &&
        gifContainerRef.current &&
        !gifContainerRef.current.contains(target) &&
        !gifButtonRef.current?.contains(target)
      ) {
        setShowGifContainer(false);
      }
    };

    if (showEmojiContainer || showGifContainer) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiContainer, showGifContainer]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      emitStopTyping();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="chat-inputarea" ref={inputAreaRef} data-testid="chat-inputarea">
        {showEmojiContainer && (
          <div className="emoji-picker-wrapper" ref={emojiPickerRef}>
            <EmojiPickerComponent
              onEmojiClick={(emojiObject: { emoji: string }) => {
                setMessage((text) => (text += emojiObject.emoji));
              }}
              pickerStyle={{ width: '352px', height: '447px' }}
            />
          </div>
        )}
        {showGifContainer && (
          <div className="giphy-container-wrapper" ref={gifContainerRef}>
            <GiphyContainer handleGiphyClick={handleGiphyClick} />
          </div>
        )}
        {showImagePreview && (
          <ImagePreview
            image={file}
            onRemoveImage={() => {
              setFile('');
              setBase64File('');
              setShowImagePreview(false);
            }}
          />
        )}
        {showGifPreview && (
          <ImagePreview
            image={gifUrl}
            onRemoveImage={() => {
              setGifUrl('');
              setShowGifPreview(false);
            }}
          />
        )}
        <form onSubmit={(e) => {
          e.preventDefault();
          handleClick(e);
        }}>
          <ul className="chat-list">
            <li
              className="chat-list-item"
              onClick={() => {
                fileInputClicked();
                setShowEmojiContainer(false);
                setShowGifContainer(false);
              }}
            >
              <Input
                ref={fileInputRef}
                id="image"
                name="image"
                type="file"
                className="file-input"
                placeholder="Select file"
                labelText=""
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                handleChange={(event) => {
                  const target = event.target as HTMLInputElement;
                  addToPreview(target.files?.[0] || null);
                }}
              />
              <img src={photo} alt="" />
            </li>
            <li
              ref={gifButtonRef}
              className="chat-list-item"
              onClick={() => {
                setShowGifContainer(!showGifContainer);
                setShowEmojiContainer(false);
              }}
            >
              <img src={gif} alt="" />
            </li>
            <li
              ref={emojiButtonRef}
              className="chat-list-item"
              onClick={() => {
                setShowEmojiContainer(!showEmojiContainer);
              }}
            >
              <img src={feeling} alt="" />
            </li>
          </ul>
          <Input
            ref={messageInputRef}
            id="message"
            name="message"
            type="text"
            className="chat-input"
            value={message}
            labelText=""
            placeholder="Message"
            handleChange={(event) => {
              setMessage(event.target.value);
              // Emit typing event when user types
              if (event.target.value.trim().length > 0) {
                emitTyping();
              } else {
                emitStopTyping();
              }
            }}
            onBlur={() => {
              // Stop typing when input loses focus
              emitStopTyping();
            }}
            onKeyDown={(e) => {
              // Handle Enter/Return key to send message
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                handleClick();
              }
            }}
          />
        </form>
        <Button 
          label={<FaPaperPlane />} 
          className="paper" 
          handleClick={() => handleClick()}
        />
      </div>
    </>
  );
};

MessageInput.propTypes = {
  setChatMessage: PropTypes.func,
  receiver: PropTypes.object,
  profile: PropTypes.object
};

export default MessageInput;

