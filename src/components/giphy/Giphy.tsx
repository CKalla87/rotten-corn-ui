import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaSearch } from 'react-icons/fa';
import Input from '@components/input/Input';
import { GiphyUtils } from '@services/utils/giphy-utils.service';
import { updatePostItem } from '@redux/reducers/post/postSlice';
import { toggleGifModal } from '@redux/reducers/modal/modalSlice';
import useDebounce from '@hooks/useDebounce';
import type { RootState } from '@redux/store';
import type { AppDispatch } from '@redux/store';
import './Giphy.scss';

interface GifImage {
  original: {
    url: string;
  };
}

interface GifData {
  images: GifImage;
  [key: string]: unknown;
}

const Giphy = () => {
  const { gifModalIsOpen } = useSelector((state: RootState) => state.modal);
  const [gifs, setGifs] = useState<GifData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const dispatch = useDispatch<AppDispatch>();

  const selectGif = (gif: string) => {
    dispatch(updatePostItem({ gifUrl: gif, image: '' }));
    dispatch(toggleGifModal(!gifModalIsOpen));
  };

  useEffect(() => {
    GiphyUtils.getTrendingGifs((gifs) => setGifs(gifs as GifData[]), setLoading);
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
      GiphyUtils.searchGifs(debouncedSearchTerm, (gifs) => setGifs(gifs as GifData[]), setLoading);
    } else {
      GiphyUtils.getTrendingGifs((gifs) => setGifs(gifs as GifData[]), setLoading);
    }
  }, [debouncedSearchTerm]);

  return (
    <div className="giphy-container" id="editable" data-testid="giphy-container">
      <div className="giphy-container-picker" style={{ height: '500px' }}>
        <div className="giphy-container-picker-form">
          <FaSearch className="search" />
          <Input
            id="gif"
            name="gif"
            type="text"
            labelText=""
            placeholder="Search Gif"
            className="giphy-container-picker-form-input"
            value={searchTerm}
            handleChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <ul className="giphy-container-picker-list" data-testid="unorderedList">
          {gifs.map((gif, index) => (
            <li
              className="giphy-container-picker-list-item"
              data-testid="list-item"
              key={index}
              onClick={() => selectGif(gif.images.original.url)}
            >
              <img style={{ width: '470px' }} src={`${gif.images.original.url}`} alt="" />
            </li>
          ))}
        </ul>

        {!gifs.length && !loading && (
          <ul className="giphy-container-picker-list">
            <li className="giphy-container-picker-list-no-item">No GIF found</li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default Giphy;

