import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaSearch } from 'react-icons/fa';
import Input from '@components/input/Input';
import Spinner from '@components/spinner/Spinner';
import { GiphyUtils } from '@services/utils/giphy-utils.service';
import useDebounce from '@hooks/useDebounce';
import './GiphyContainer.scss';

interface GiphyContainerProps {
  handleGiphyClick?: (gifUrl: string) => void;
}

const GiphyContainer = ({ handleGiphyClick }: GiphyContainerProps) => {
  const [gifs, setGifs] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    // Defer state update to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => {
      setError(null);
    }, 0);
    GiphyUtils.getTrendingGifs(setGifs, setLoading).catch(() => {
      setError('Failed to load trending GIFs. Please try again.');
    });
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    // Defer state update to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => {
      setError(null);
    }, 0);
    if (debouncedSearchTerm) {
      GiphyUtils.searchGifs(debouncedSearchTerm, setGifs, setLoading).catch(() => {
        setError('Failed to search GIFs. Please try again.');
      });
    } else {
      GiphyUtils.getTrendingGifs(setGifs, setLoading).catch(() => {
        setError('Failed to load trending GIFs. Please try again.');
      });
    }
    return () => clearTimeout(timeoutId);
  }, [debouncedSearchTerm]);

  return (
    <div className="giphy-search-container" data-testid="giphy-container">
      <div className="giphy-search-input">
        <FaSearch className="search" />
        <Input
          id="gif"
          name="gif"
          type="text"
          labelText=""
          placeholder="Search Gif"
          className="search-input"
          value={searchTerm}
          handleChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {loading && <Spinner />}
      {error && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#ff4444' }}>
          {error}
        </div>
      )}
      {!loading && !error && gifs.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          No GIFs found. Try searching for something else.
        </div>
      )}
      <ul className="search-results">
        {gifs.map((gif, index) => {
          const gifData = gif as { images?: { original?: { url?: string } } };
          const gifUrl = gifData?.images?.original?.url || '';
          if (!gifUrl) return null;
          return (
            <li
              className="gif-result"
              data-testid="list-item"
              key={`gif-${index}-${gifUrl.substring(0, 20)}`}
              onClick={() => {
                if (gifUrl && handleGiphyClick) {
                  handleGiphyClick(gifUrl);
                }
              }}
            >
              <img src={gifUrl} alt="GIF" loading="lazy" />
            </li>
          );
        })}
      </ul>
    </div>
  );
};

GiphyContainer.propTypes = {
  handleGiphyClick: PropTypes.func
};

export default GiphyContainer;

