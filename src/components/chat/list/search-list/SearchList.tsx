import PropTypes from 'prop-types';
import { useLocation, useNavigate, createSearchParams } from 'react-router-dom';
import Avatar from '@components/avatar/Avatar';
import './SearchList.scss';

interface UserData {
  _id?: string;
  username?: string;
  avatarColor?: string;
  profilePicture?: string;
  [key: string]: unknown;
}

interface SearchListProps {
  result?: UserData[];
  isSearching?: boolean;
  searchTerm?: string;
  setSelectedUser?: (user: UserData) => void;
  setSearch?: (search: string) => void;
  setIsSearching?: (isSearching: boolean) => void;
  setSearchResult?: (result: UserData[]) => void;
  setComponentType?: (type: string) => void;
}

const SearchList = ({
  result = [],
  isSearching = false,
  searchTerm = '',
  setSelectedUser,
  setSearch,
  setIsSearching,
  setSearchResult,
  setComponentType
}: SearchListProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const addUsernameToUrlQuery = (user: UserData) => {
    if (setComponentType) {
      setComponentType('searchList');
    }
    if (setSelectedUser) {
      setSelectedUser(user);
    }
    const url = `${location.pathname}?${createSearchParams({ username: user.username?.toLowerCase() || '', id: user._id || '' })}`;
    navigate(url);
    if (setSearch) {
      setSearch('');
    }
    if (setIsSearching) {
      setIsSearching(false);
    }
    if (setSearchResult) {
      setSearchResult([]);
    }
  };

  return (
    <div className="search-result">
      <div className="search-result-container">
        {!isSearching && result.length > 0 && (
          <>
            {result.map((user) => (
              <div
                key={user._id}
                data-testid="search-result-item"
                className="search-result-container-item"
                onClick={() => addUsernameToUrlQuery(user)}
              >
                <Avatar
                  name={user.username}
                  bgColor={user.avatarColor}
                  textColor="#ffffff"
                  size={40}
                  avatarSrc={user.profilePicture}
                />
                <div className="username">{user.username}</div>
              </div>
            ))}
          </>
        )}
        {searchTerm && isSearching && result.length === 0 && (
          <div className="search-result-container-empty" data-testid="searching-text">
            <span>Searching...</span>
          </div>
        )}
        {searchTerm && !isSearching && result.length === 0 && (
          <div className="search-result-container-empty" data-testid="nothing-found">
            <span>Nothing found</span>
            <p className="search-result-container-empty-msg">We couldn&apos;t find any match for {searchTerm}</p>
          </div>
        )}
      </div>
    </div>
  );
};

SearchList.propTypes = {
  result: PropTypes.array,
  isSearching: PropTypes.bool,
  searchTerm: PropTypes.string,
  setSelectedUser: PropTypes.func,
  setSearch: PropTypes.func,
  setIsSearching: PropTypes.func,
  setSearchResult: PropTypes.func,
  setComponentType: PropTypes.func
};

export default SearchList;

