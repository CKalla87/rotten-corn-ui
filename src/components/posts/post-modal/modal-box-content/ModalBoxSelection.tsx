import { useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import photo from '@assets/images/photo.png';
import gif from '@assets/images/gif.png';
import feeling from '@assets/images/feeling.png';
import Input from '@components/input/Input';
import Feelings from '@components/feelings/Feelings';
import useDetectOutsideClick from '@hooks/useDetectOutsideClick';
import { ImageUtils } from '@services/utils/image-utils.service';
import { toggleGifModal } from '@redux/reducers/modal/modalSlice';
import type { RootState } from '@redux/store';
import type { AppDispatch } from '@redux/store';
import './ModalBoxSelection.scss';

interface ModalBoxSelectionProps {
  setSelectedPostImage: (file: File | null) => void;
  setSelectedVideo: (file: File | null) => void;
}

const ModalBoxSelection = ({ setSelectedPostImage, setSelectedVideo }: ModalBoxSelectionProps) => {
  const { feelingsIsOpen, gifModalIsOpen } = useSelector((state: RootState) => state.modal);
  const post = useSelector((state: RootState) => state.post);
  const feelingsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [toggleFeelings, setToggleFeelings] = useDetectOutsideClick(feelingsRef, feelingsIsOpen);
  const dispatch = useDispatch<AppDispatch>();

  const fileInputClicked = () => {
    fileInputRef.current?.click();
  };

  const videoInputClicked = () => {
    videoInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    ImageUtils.addFileToRedux(event, post, setSelectedPostImage, dispatch, 'image');
  };

  const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    ImageUtils.addFileToRedux(event, post, setSelectedVideo, dispatch, 'video');
  };

  return (
    <>
      {toggleFeelings && (
        <div ref={feelingsRef}>
          <Feelings />
        </div>
      )}
      <div className="modal-box-selection" data-testid="modal-box-selection">
        <ul className="post-form-list" data-testid="list-item">
          <li className="post-form-list-item image-select" onClick={fileInputClicked}>
            <Input
              name="image"
              ref={fileInputRef}
              type="file"
              className="file-input"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              handleChange={handleFileChange}
            />
            <img src={photo} alt="" /> Photo
          </li>
          <li className="post-form-list-item" onClick={() => dispatch(toggleGifModal(!gifModalIsOpen))}>
            <img src={gif} alt="" /> Gif
          </li>
          <li className="post-form-list-item" onClick={() => setToggleFeelings(!toggleFeelings)}>
            <img src={feeling} alt="" /> Feeling
          </li>
          <li className="post-form-list-item image-select" onClick={videoInputClicked}>
            <Input
              name="video"
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="file-input"
              onClick={() => {
                if (videoInputRef.current) {
                  videoInputRef.current.value = '';
                }
              }}
              handleChange={handleVideoFileChange}
            />
            <img src={photo} alt="" /> Video
          </li>
        </ul>
      </div>
    </>
  );
};

ModalBoxSelection.propTypes = {
  setSelectedPostImage: PropTypes.func.isRequired,
  setSelectedVideo: PropTypes.func.isRequired
};

export default ModalBoxSelection;

