import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams, useLocation, useNavigate, createSearchParams } from 'react-router-dom';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { find } from 'lodash';
import Avatar from '@components/avatar/Avatar';
import Input from '@components/input/Input';
import SearchList from '@components/chat/list/search-list/SearchList';
import ChatListBody from '@components/chat/list/ChatListBody';
import { ChatUtils } from '@services/utils/chat-utils.service';
import { Utils } from '@services/utils/utils.service';
import { timeAgo } from '@services/utils/timeago.utils';
import { userService } from '@services/api/user/user.service';
import { chatService } from '@services/api/chat/chat.service';
import useDebounce from '@hooks/useDebounce';
import { setSelectedChatUser } from '@redux/reducers/chat/chatSlice';
import type { RootState, AppDispatch } from '@redux/store';
import './ChatList.scss';

interface UserData {
  _id?: string;
  username?: string;
  avatarColor?: string;
  profilePicture?: string;
  [key: string]: unknown;
}

interface ChatUser {
  receiverId?: string;
  receiverUsername?: string;
  receiverAvatarColor?: string;
  receiverProfilePicture?: string;
  senderId?: string;
  senderUsername?: string;
  senderAvatarColor?: string;
  senderProfilePicture?: string;
  body?: string;
  conversationId?: string;
  createdAt?: string | Date;
  isRead?: boolean;
  deleteForMe?: boolean;
  deleteForEveryone?: boolean;
  [key: string]: unknown;
}

const ChatList = () => {
  const { profile } = useSelector((state: RootState) => state.user);
  const { chatList } = useSelector((state: RootState) => state.chat);
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState<UserData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [componentType, setComponentType] = useState('chatList');
  const [chatMessageList, setChatMessageList] = useState<ChatUser[]>([]);
  const debouncedValue = useDebounce(search, 1000);

  const searchUsers = useCallback(
    async (query: string) => {
      setIsSearching(true);
      try {
        setSearch(query);
        if (query) {
          const response = await userService.searchUsers(query);
          setSearchResult(response.data.search);
          setIsSearching(false);
        }
      } catch (error: unknown) {
        setIsSearching(false);
        const axiosError = error as { response?: { data?: { message?: string } } };
        Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
      }
    },
    [dispatch]
  );

  const addSelectedUserToList = useCallback(
    (user: UserData) => {
      const newUser: ChatUser = {
        receiverId: user?._id as string,
        receiverUsername: user?.username as string,
        receiverAvatarColor: user?.avatarColor as string,
        receiverProfilePicture: user?.profilePicture as string,
        senderId: profile?._id as string,
        senderUsername: profile?.username as string,
        senderAvatarColor: profile?.avatarColor as string,
        senderProfilePicture: profile?.profilePicture as string,
        body: ''
      };
      ChatUtils.joinRoomEvent(newUser, profile || {});
      ChatUtils.clearPrivateChatMessages();
      const findUser = find(chatMessageList, (chat) => chat.receiverId === searchParams.get('id') || chat.senderId === searchParams.get('id'));
      if (!findUser) {
        const newChatList = [newUser, ...chatMessageList];
        setChatMessageList(newChatList);
        if (!chatList.length) {
          dispatch(setSelectedChatUser({ isLoading: false, user: newUser as unknown as UserData }));
          const userTwoName = newUser?.receiverUsername !== profile?.username ? newUser?.receiverUsername : newUser?.senderUsername;
          chatService.addChatUsers({ userOne: profile?.username, userTwo: userTwoName });
        }
      }
    },
    [chatList, chatMessageList, dispatch, profile, searchParams]
  );

  useEffect(() => {
    if (!chatList.length && chatMessageList.length) {
      dispatch(setSelectedChatUser({ isLoading: false, user: chatMessageList[0] as unknown as UserData }));
      const userTwoName =
        chatMessageList[0]?.receiverUsername !== profile?.username
          ? chatMessageList[0]?.receiverUsername
          : chatMessageList[0]?.senderUsername;
      chatService.addChatUsers({ userOne: profile?.username, userTwo: userTwoName });
    }
  }, [chatList, chatMessageList, dispatch, profile]);

  useEffect(() => {
    if (debouncedValue) {
      void searchUsers(debouncedValue);
    }
  }, [debouncedValue, searchUsers]);

  useEffect(() => {
    if (selectedUser && componentType === 'searchList') {
      // Using setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        addSelectedUserToList(selectedUser);
      }, 0);
    }
  }, [addSelectedUserToList, componentType, selectedUser]);

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setChatMessageList(chatList as ChatUser[]);
    }, 0);
  }, [chatList]);

  useEffect(() => {
    ChatUtils.socketIOChatList(profile || {}, chatMessageList, setChatMessageList);
  }, [chatMessageList, profile]);

  const addUsernameToSearchReducer = (user: UserData) => {
    dispatch(setSelectedChatUser({ isLoading: false, user }));
    setSearch('');
    setIsSearching(false);
    setSearchResult([]);
    setComponentType('');
  };

  const updateQueryParams = (user: UserData) => {
    setSelectedUser(user);
    const params = ChatUtils.chatUrlParams(user as unknown as ChatUser, profile || {});
    ChatUtils.joinRoomEvent(user as unknown as ChatUser, profile || {});
    // Clear private chat messages using a method if available, or handle differently
    // Note: This modifies external state, but it's necessary for the chat functionality
    ChatUtils.clearPrivateChatMessages();
    return params;
  };

  // this is for when a user already exist in the chat list
  const addUsernameToUrlQuery = async (user: UserData) => {
    try {
      const sender = find(
        ChatUtils.chatUsers,
        (userData) =>
          userData.userOne === profile?.username && (userData.userTwo as string)?.toLowerCase() === searchParams.get('username')?.toLowerCase()
      );
      const params = updateQueryParams(user);
      const userTwoName = user?.receiverUsername !== profile?.username ? user?.receiverUsername : user?.senderUsername;
      const receiverId = user?.receiverUsername !== profile?.username ? user?._id : user?._id;
      navigate(`${location.pathname}?${createSearchParams(params)}`);
      if (sender) {
        chatService.removeChatUsers(sender);
      }
      chatService.addChatUsers({ userOne: profile?.username, userTwo: userTwoName });
      if (user?.receiverUsername === profile?.username && !(user as ChatUser).isRead) {
        await chatService.markMessagesAsRead(profile?._id as string, receiverId as string);
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  return (
    <div data-testid="chatList">
      <div className="conversation-container">
        <div className="conversation-container-header">
          <div className="header-img">
            <Avatar
              name={profile?.username}
              bgColor={profile?.avatarColor}
              textColor="#ffffff"
              size={40}
              avatarSrc={profile?.profilePicture}
            />
          </div>
          <div className="title-text">{profile?.username}</div>
        </div>
        <div className="conversation-container-search" data-testid="search-container">
          <FaSearch className="search" />
          <Input
            id="message"
            name="message"
            type="text"
            value={search}
            className="search-input"
            labelText=""
            placeholder="Search"
            handleChange={(event) => {
              setIsSearching(true);
              setSearch(event.target.value);
            }}
          />
          {search && (
            <FaTimes
              className="times"
              onClick={() => {
                setSearch('');
                setIsSearching(false);
                setSearchResult([]);
              }}
            />
          )}
        </div>
        {search && (
          <SearchList
            searchTerm={search}
            result={searchResult}
            isSearching={isSearching}
            setSearchResult={setSearchResult}
            setIsSearching={setIsSearching}
            setSearch={setSearch}
            setSelectedUser={addUsernameToSearchReducer}
            setComponentType={setComponentType}
          />
        )}
        {!search && (
          <div className="conversation-container-body" onClick={() => {
            setSearch('');
            setIsSearching(false);
            setSearchResult([]);
          }}>
            <div className="conversation">
              {chatMessageList.map((data) => (
                <div
                  key={Utils.generateString(10)}
                  data-testid="conversation-item"
                  className={`conversation-item ${
                    searchParams.get('username') === data?.receiverUsername?.toLowerCase() ||
                    searchParams.get('username') === data?.senderUsername?.toLowerCase()
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => addUsernameToUrlQuery(data as unknown as UserData)}
                >
                  <div className="avatar">
                    <Avatar
                      name={
                        data.receiverUsername === profile?.username
                          ? profile?.username
                          : data?.senderUsername
                      }
                      bgColor={
                        data.receiverUsername === profile?.username
                          ? data.receiverAvatarColor
                          : data?.senderAvatarColor
                      }
                      textColor="#ffffff"
                      size={40}
                      avatarSrc={
                        data.receiverUsername !== profile?.username
                          ? data.receiverProfilePicture
                          : data?.senderProfilePicture
                      }
                    />
                  </div>
                  <div className={`title-text ${selectedUser && !data.body ? 'selected-user-text' : ''}`}>
                    {data.receiverUsername !== profile?.username ? data.receiverUsername : data?.senderUsername}
                  </div>
                  {data?.createdAt && (
                    <div className="created-date">{timeAgo.transform(data.createdAt)}</div>
                  )}
                  {!data?.body && (
                    <div className="created-date">
                      <FaTimes />
                    </div>
                  )}
                  {data?.body && !data?.deleteForMe && !data.deleteForEveryone && (
                    <ChatListBody data={data} profile={profile || undefined} />
                  )}
                  {data?.deleteForMe && data?.deleteForEveryone && (
                    <div className="conversation-message">
                      <span className="message-deleted">message deleted</span>
                    </div>
                  )}
                  {data?.deleteForMe && !data.deleteForEveryone && data.senderUsername !== profile?.username && (
                    <div className="conversation-message">
                      <span className="message-deleted">message deleted</span>
                    </div>
                  )}
                  {data?.deleteForMe && !data.deleteForEveryone && data.receiverUsername !== profile?.username && (
                    <ChatListBody data={data} profile={profile || undefined} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;

