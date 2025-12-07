import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaSearch } from 'react-icons/fa';
import Input from '@components/input/Input';
import Spinner from '@components/spinner/Spinner';
import { GiphyUtils } from '@services/utils/giphy-utils.service';
import { Utils } from '@services/utils/utils.service';
import useDebounce from '@hooks/useDebounce';
import './GiphyContainer.scss';

interface GiphyContainerProps {
  handleGiphyClick?: (gifUrl: string) => void;
}

const GiphyContainer = ({ handleGiphyClick }: GiphyContainerProps) => {
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    GiphyUtils.getTrendingGifs(setGifs, setLoading);
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
      GiphyUtils.searchGifs(debouncedSearchTerm, setGifs, setLoading);
    } else {
      GiphyUtils.getTrendingGifs(setGifs, setLoading);
    }
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
      <ul className="search-results">
        {gifs.map((gif) => (
          <li
            className="gif-result"
            data-testid="list-item"
            key={Utils.generateString(10)}
            onClick={() => handleGiphyClick?.(gif.images.original.url)}
          >
            <img src={gif.images.original.url} alt="" />
          </li>
        ))}
      </ul>
    </div>
  );
};

GiphyContainer.propTypes = {
  handleGiphyClick: PropTypes.func
};

export default GiphyContainer;

