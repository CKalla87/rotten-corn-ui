import { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { some } from 'lodash';
import Avatar from '@components/avatar/Avatar';
import { MessageInput } from '@components/chat/window';
import { MessageDisplay } from '@components/chat/window/message-display';
import { chatService } from '@services/api/chat/chat.service';
import { userService } from '@services/api/user/user.service';
import { ChatUtils } from '@services/utils/chat-utils.service';
import { Utils } from '@services/utils/utils.service';
import { setSelectedChatUser } from '@redux/reducers/chat/chatSlice';
import useEffectOnce from '@hooks/useEffectOnce';
import type { RootState, AppDispatch } from '@redux/store';
import type { UserProfile } from '@redux/reducers/user/userSlice';
import './ChatWindow.scss';

const ChatWindow = () => {
  const { profile } = useSelector((state: RootState) => state.user);
  const { isLoading } = useSelector((state: RootState) => state.chat);
  const [receiver, setReceiver] = useState<UserProfile | undefined>();
  const [conversationId, setConversationId] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<Record<string, unknown>>>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [searchParams] = useSearchParams();
  const [rendered, setRendered] = useState(false);
  const isSendingMessageRef = useRef(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  // Function to scroll chat to bottom
  const scrollToBottom = useCallback(() => {
    const scrollContainer = document.querySelector('.chat-window-message') as HTMLElement;
    if (scrollContainer) {
      // Wait for DOM to update, then scroll
      setTimeout(() => {
        const scrollHeight = scrollContainer.scrollHeight;
        const clientHeight = scrollContainer.clientHeight;
        const maxScroll = scrollHeight - clientHeight;
        
        console.log('📜 Attempting to scroll:', {
          scrollHeight,
          clientHeight,
          maxScroll,
          currentScrollTop: scrollContainer.scrollTop
        });
        
        // Scroll to bottom
        scrollContainer.scrollTo({
          top: scrollHeight,
          behavior: 'smooth'
        });
        
        // Verify scroll happened after a delay
        setTimeout(() => {
          const newScrollTop = scrollContainer.scrollTop;
          const distanceFromBottom = scrollHeight - newScrollTop - clientHeight;
          console.log('📜 Scroll result:', {
            newScrollTop,
            distanceFromBottom,
            atBottom: distanceFromBottom < 20
          });
          
          // If not at bottom, try again with instant scroll
          if (distanceFromBottom > 20) {
            console.log('📜 Retrying with instant scroll');
            scrollContainer.scrollTop = scrollHeight;
          }
        }, 300);
      }, 250);
    } else {
      console.warn('⚠️ Could not find .chat-window-message element');
    }
  }, []);

  const getChatMessages = useCallback(
    async (receiverId: string) => {
      try {
        const response = await chatService.getChatMessages(receiverId);
        console.log('💬 Chat messages received:', response.data.messages);
        // Log message images for debugging
        response.data.messages?.forEach((msg: Record<string, unknown>, idx: number) => {
          if (msg.selectedImage || msg.gifUrl) {
            console.log(`📷 Message ${idx} image data:`, {
              selectedImage: msg.selectedImage,
              gifUrl: msg.gifUrl,
              body: msg.body,
              receiverId: msg.receiverId,
              senderId: msg.senderId
            });
          }
        });
        
        // Preserve optimistic messages when fetching (unless we're not sending)
        if (!isSendingMessageRef.current) {
          // Update ChatUtils with server messages
          ChatUtils.privateChatMessages = [...response.data.messages];
          setChatMessages([...ChatUtils.privateChatMessages]);
        } else {
          // If sending, preserve optimistic messages
          setChatMessages((prevMessages) => {
            // Find any optimistic (temp) messages
            const optimisticMessages = prevMessages.filter((msg) => {
              const msgId = msg._id as string;
              return msgId?.startsWith('temp-');
            });
            
            // Update ChatUtils with server messages
            ChatUtils.privateChatMessages = [...response.data.messages];
            
            // Merge server messages with optimistic messages, removing duplicates
            const serverMessageIds = new Set(response.data.messages.map((msg: Record<string, unknown>) => msg._id));
            const uniqueOptimisticMessages = optimisticMessages.filter((msg) => {
              const msgId = msg._id as string;
              return !serverMessageIds.has(msgId);
            });
            
            // Combine server messages with remaining optimistic messages
            const mergedMessages = [...response.data.messages, ...uniqueOptimisticMessages];
            return mergedMessages;
          });
        }
      } catch (error: unknown) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
      }
    },
    [dispatch]
  );

  const getNewUserMessages = useCallback(() => {
    if (searchParams.get('id') && searchParams.get('username')) {
      setConversationId('');
      // Don't clear messages here - let getChatMessages handle merging
      getChatMessages(searchParams.get('id') || '');
    }
  }, [getChatMessages, searchParams]);

  const getUserProfileByUserId = useCallback(
    async () => {
      try {
        const response = await userService.getUserProfileByUserId(searchParams.get('id') || '');
        setReceiver(response.data.user);
        ChatUtils.joinRoomEvent(response.data.user, profile || {});
      } catch (error: unknown) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
      }
    },
    [dispatch, profile, searchParams]
  );

  const sendChatMessage = async (message: string, gifUrl: string, selectedImage: string) => {
    if (!receiver || !receiver._id) {
      Utils.dispatchNotification('Cannot send message: receiver not selected', 'error', dispatch);
      return;
    }

    if (!message.trim() && !gifUrl && !selectedImage) {
      return;
    }

    // Set flag to prevent message clearing during send
    isSendingMessageRef.current = true;

    try {
      const checkUserOne = some(
        ChatUtils.chatUsers,
        (user) => user?.userOne === profile?.username && user?.userTwo === receiver?.username
      );
      const checkUserTwo = some(
        ChatUtils.chatUsers,
        (user) => user?.userOne === receiver?.username && user?.userTwo === profile?.username
      );
      const messageData = ChatUtils.messageData({
        receiver,
        conversationId,
        message,
        searchParamsId: searchParams.get('id') || '',
        chatMessages,
        gifUrl,
        selectedImage,
        isRead: checkUserOne && checkUserTwo
      });
      
      // Validate required fields before sending
      if (!messageData.receiverId || messageData.receiverId.trim() === '') {
        Utils.dispatchNotification('Cannot send message: receiver ID is missing', 'error', dispatch);
        console.error('❌ Missing receiverId. Receiver:', receiver, 'MessageData:', messageData);
        return;
      }
      
      console.log('📤 Sending chat message:', JSON.stringify(messageData, null, 2));
      
      // Create optimistic message to add immediately to UI
      const tempMessageId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const optimisticMessage: Record<string, unknown> = {
        _id: tempMessageId,
        body: messageData.body,
        senderId: profile?._id || '',
        senderUsername: profile?.username || '',
        receiverId: messageData.receiverId,
        receiverUsername: messageData.receiverUsername || receiver?.username || '',
        conversationId: messageData.conversationId || conversationId,
        isRead: messageData.isRead || false,
        createdAt: new Date().toISOString(),
        deleteForMe: false,
        deleteForEveryone: false
      };
      
      console.log('🔍 Optimistic message details:', {
        senderId: optimisticMessage.senderId,
        senderUsername: optimisticMessage.senderUsername,
        receiverId: optimisticMessage.receiverId,
        receiverUsername: optimisticMessage.receiverUsername,
        profileId: profile?._id,
        profileUsername: profile?.username,
        receiverIdFromData: messageData.receiverId,
        receiverUsernameFromData: messageData.receiverUsername
      });
      
      // Ensure senderId and receiverId are different
      if (optimisticMessage.senderId === optimisticMessage.receiverId) {
        console.error('❌ ERROR: senderId and receiverId are the same!', {
          senderId: optimisticMessage.senderId,
          receiverId: optimisticMessage.receiverId,
          profile: profile,
          receiver: receiver
        });
      }
      
      // Add image or GIF data if present
      if (gifUrl) {
        optimisticMessage.gifUrl = gifUrl;
      }
      if (selectedImage) {
        optimisticMessage.selectedImage = selectedImage;
      }
      
      // Immediately add the message to local state for instant UI update
      // Create a new array to ensure React detects the change
      const updatedMessages = [...chatMessages];
      updatedMessages.push(optimisticMessage);
      
      // Update ChatUtils first
      ChatUtils.privateChatMessages = [...ChatUtils.privateChatMessages, optimisticMessage];
      
      console.log('✨ Optimistic message added:', optimisticMessage);
      console.log('📋 Updated messages count:', updatedMessages.length);
      console.log('📋 Previous messages count:', chatMessages.length);
      console.log('📋 Current chatMessages state:', chatMessages);
      console.log('📋 Updated messages array:', updatedMessages);
      
      // Update state - React should detect the new array reference
      setChatMessages(updatedMessages);
      
      // Verify the message will be displayed
      const willDisplay = (optimisticMessage.receiverUsername === profile?.username || optimisticMessage.senderUsername === profile?.username);
      console.log('👁️ Will message display?', willDisplay, {
        receiverUsername: optimisticMessage.receiverUsername,
        senderUsername: optimisticMessage.senderUsername,
        profileUsername: profile?.username
      });
      
      if (!willDisplay) {
        console.error('❌ Optimistic message will NOT be displayed due to username mismatch!');
      }
      
      // Scroll to bottom after adding optimistic message
      scrollToBottom();
      
      // Send to API
      const response = await chatService.saveChatMessage(messageData);
      console.log('✅ Chat message sent successfully:', response);
      console.log('📦 Response data:', response?.data);
      console.log('📦 Response data.message:', response?.data?.message);
      
      // Replace the temporary message with the real one from the server if available
      // The server might return the message in response.data.message or response.data
      const serverMessage = (response?.data?.message || response?.data) as Record<string, unknown>;
      if (serverMessage && serverMessage._id) {
        console.log('🔄 Replacing temp message with server message:', serverMessage);
        setChatMessages((prevMessages) => {
          const messageIndex = prevMessages.findIndex((msg) => (msg._id as string) === tempMessageId);
          if (messageIndex > -1) {
            const finalMessages = [...prevMessages];
            finalMessages[messageIndex] = serverMessage;
            console.log('✅ Replaced temp message at index:', messageIndex);
            // Update ChatUtils.privateChatMessages
            const utilsIndex = ChatUtils.privateChatMessages.findIndex((msg) => (msg._id as string) === tempMessageId);
            if (utilsIndex > -1) {
              ChatUtils.privateChatMessages[utilsIndex] = serverMessage;
            }
            // Scroll to bottom after replacing with server message
            scrollToBottom();
            return finalMessages;
          } else {
            console.log('⚠️ Temp message not found, adding server message');
            // If temp message not found, just add the server message
            ChatUtils.privateChatMessages.push(serverMessage);
            const newMessages = [...prevMessages, serverMessage];
            // Scroll to bottom after adding server message
            scrollToBottom();
            return newMessages;
          }
        });
      } else {
        console.log('ℹ️ Server response does not include message object, keeping optimistic message. Socket will update it.');
      }
      
      // Clear flag after successful send
      isSendingMessageRef.current = false;
    } catch (error: unknown) {
      const axiosError = error as { 
        response?: { 
          status?: number;
          data?: { 
            message?: string;
            error?: string;
            [key: string]: unknown;
          };
        };
        message?: string;
      };
      
      // Remove the optimistic message on error
      setChatMessages((prevMessages) => {
        const tempMessageId = prevMessages.find((msg) => (msg._id as string)?.startsWith('temp-'))?._id;
        if (tempMessageId) {
          ChatUtils.privateChatMessages = ChatUtils.privateChatMessages.filter(
            (msg) => (msg._id as string) !== tempMessageId
          );
          return prevMessages.filter((msg) => (msg._id as string) !== tempMessageId);
        }
        return prevMessages;
      });
      
      // Log full error details - expand errorData for debugging
      const errorResponse = axiosError?.response?.data;
      console.error('❌ Error sending chat message:', {
        status: axiosError?.response?.status,
        errorMessage: errorResponse?.message || errorResponse?.error || 'Unknown error',
        errorData: JSON.stringify(errorResponse, null, 2),
        fullErrorResponse: errorResponse,
        message: axiosError?.message
      });
      
      const errorMessage = axiosError?.response?.data?.message || 
                          axiosError?.response?.data?.error || 
                          axiosError?.message || 
                          'An error occurred while sending message';
      Utils.dispatchNotification(errorMessage, 'error', dispatch);
      
      // Clear flag on error
      isSendingMessageRef.current = false;
    }
  };

  const updateMessageReaction = async (body: unknown) => {
    try {
      const reactionBody = body as {
        conversationId?: string;
        messageId?: string;
        reaction?: string;
        type?: string;
      };
      
      // Optimistic update - add reaction immediately to UI
      if (reactionBody.messageId && reactionBody.reaction && reactionBody.type === 'add') {
        setChatMessages((prevMessages) => {
          const messageIndex = prevMessages.findIndex((msg) => msg._id === reactionBody.messageId);
          if (messageIndex > -1) {
            const updatedMessages = [...prevMessages];
            const message = { ...updatedMessages[messageIndex] };
            
            // Get current reactions or initialize empty array
            const currentReactions = (message.reaction as Array<{ senderName?: string; type?: string; [key: string]: unknown }>) || [];
            
            // Check if user already has ANY reaction (not just the same type)
            // If they do, replace it with the new one (backend replaces old reaction with new one)
            const existingReactionIndex = currentReactions.findIndex(
              (r) => r.senderName === profile?.username
            );
            
            const newReaction = {
              senderName: profile?.username || '',
              type: reactionBody.reaction
            };
            
            if (existingReactionIndex > -1) {
              // User already has a reaction - replace it with the new one
              const updatedReactions = [...currentReactions];
              updatedReactions[existingReactionIndex] = newReaction;
              message.reaction = updatedReactions;
            } else {
              // User doesn't have a reaction yet - add the new one
              message.reaction = [...currentReactions, newReaction];
            }
            
            updatedMessages[messageIndex] = message;
            
            // Also update ChatUtils
            const utilsIndex = ChatUtils.privateChatMessages.findIndex((msg) => msg._id === reactionBody.messageId);
            if (utilsIndex > -1) {
              ChatUtils.privateChatMessages[utilsIndex] = message;
            }
            
            return updatedMessages;
          }
          return prevMessages;
        });
      } else if (reactionBody.messageId && reactionBody.reaction && reactionBody.type === 'remove') {
        // Optimistic update - remove reaction immediately from UI
        setChatMessages((prevMessages) => {
          const messageIndex = prevMessages.findIndex((msg) => msg._id === reactionBody.messageId);
          if (messageIndex > -1) {
            const updatedMessages = [...prevMessages];
            const message = { ...updatedMessages[messageIndex] };
            
            // Get current reactions
            const currentReactions = (message.reaction as Array<{ senderName?: string; type?: string; [key: string]: unknown }>) || [];
            
            // Remove reaction
            const filteredReactions = currentReactions.filter(
              (r) => !(r.senderName === profile?.username && r.type === reactionBody.reaction)
            );
            message.reaction = filteredReactions;
            
            updatedMessages[messageIndex] = message;
            
            // Also update ChatUtils
            const utilsIndex = ChatUtils.privateChatMessages.findIndex((msg) => msg._id === reactionBody.messageId);
            if (utilsIndex > -1) {
              ChatUtils.privateChatMessages[utilsIndex] = message;
            }
            
            return updatedMessages;
          }
          return prevMessages;
        });
      }
      
      // Send to API
      await chatService.updateMessageReaction(body);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
      
      // On error, refresh messages from server to get correct state
      // The socket will handle the update, so we don't need to manually refresh
    }
  };

  const deleteChatMessage = async (senderId: string, receiverId: string, messageId: string, type: string) => {
    try {
      await chatService.markMessageAsDelete(messageId, senderId, receiverId, type);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  useEffectOnce(() => {
    getUserProfileByUserId();
    getNewUserMessages();
  });

  useEffect(() => {
    if (rendered) {
      getUserProfileByUserId();
      getNewUserMessages();
    }
    if (!rendered) setRendered(true);
  }, [getUserProfileByUserId, getNewUserMessages, searchParams, rendered]);

  useEffect(() => {
    if (rendered) {
      ChatUtils.socketIOMessageReceived(chatMessages, searchParams.get('username') || '', setConversationId, setChatMessages);
      ChatUtils.socketIOTyping(searchParams.get('username') || '', setTypingUsers);
    }
    if (!rendered) setRendered(true);
    ChatUtils.usersOnline((data: unknown) => {
      setOnlineUsers(data as string[]);
    });
    ChatUtils.usersOnChatPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, rendered]);
  
  // Debug: Log when chatMessages state changes and scroll to bottom
  useEffect(() => {
    console.log('🔄 chatMessages state changed, new length:', chatMessages.length);
    console.log('🔄 Last message:', chatMessages[chatMessages.length - 1]);
    
    // Scroll to bottom when messages change (including new messages from socket)
    // Only scroll if it's a new message (not initial load)
    if (chatMessages.length > 0) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      const isNewMessage = (lastMessage._id as string)?.startsWith('temp-') || 
                          (lastMessage.createdAt && new Date(lastMessage.createdAt as string).getTime() > Date.now() - 5000);
      
      if (isNewMessage) {
        scrollToBottom();
      }
    }
  }, [chatMessages, scrollToBottom]);

  useEffect(() => {
    if (rendered) {
      ChatUtils.socketIOMessageReaction(chatMessages, searchParams.get('username') || '', setConversationId, setChatMessages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, rendered]);

  return (
    <div className="chat-window-container" data-testid="chatWindowContainer">
      {isLoading ? (
        <div className="message-loading" data-testid="message-loading"></div>
      ) : (
        <div data-testid="chatWindow">
          <div className="chat-title" data-testid="chat-title">
            <button
              className="chat-back-button"
              onClick={() => {
                dispatch(setSelectedChatUser({ isLoading: false, user: null }));
                navigate('/app/social/chat/messages');
              }}
              aria-label="Back to chat list"
            >
              <FaArrowLeft />
            </button>
            {receiver && (
              <div className="chat-title-avatar">
                <Avatar
                  name={receiver?.username}
                  bgColor={receiver?.avatarColor}
                  textColor="#ffffff"
                  size={32}
                  avatarSrc={receiver?.profilePicture || receiver?.avatarImage}
                />
              </div>
            )}
            {receiver && (
              <div className="chat-title-items">
                <div
                  className={`chat-name ${Utils.checkIfUserIsOnline(receiver?.username || '', onlineUsers) ? '' : 'user-not-online'}`}
                >
                  {receiver?.username || ''}
                </div>
                {Utils.checkIfUserIsOnline(receiver?.username || '', onlineUsers) && (
                  <span className="chat-active">Online</span>
                )}
              </div>
            )}
          </div>
          <div className="chat-window">
            <div className="chat-window-message">
              <MessageDisplay
                chatMessages={chatMessages}
                profile={profile || undefined}
                updateMessageReaction={updateMessageReaction}
                deleteChatMessage={deleteChatMessage}
                typingUsers={typingUsers}
                receiver={receiver}
              />
            </div>
            <div className="chat-window-input">
              <MessageInput 
                setChatMessage={(message: string, url?: string, base64File?: string) => {
                  sendChatMessage(message, url || '', base64File || '');
                }}
                receiver={receiver}
                profile={profile || undefined}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;

