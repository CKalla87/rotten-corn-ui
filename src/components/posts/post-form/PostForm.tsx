import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Avatar from '@components/avatar/Avatar';
import Input from '@components/input/Input';
import AddPost from '@components/posts/post-modal/post-add/AddPost';
import EditPost from '@components/posts/post-modal/post-edit/EditPost';
import photo from '@assets/images/photo.png';
import gif from '@assets/images/gif.png';
import feeling from '@assets/images/feeling.png';
import { FaVideo } from 'react-icons/fa';
import { ImageUtils } from '@services/utils/image-utils.service';
import { openModal, toggleImageModal, toggleGifModal, toggleFeelingModal, toggleVideoModal } from '@redux/reducers/modal/modalSlice';
import type { RootState } from '@redux/store';
import type { AppDispatch } from '@redux/store';
import './PostForm.scss';

const PostForm = () => {
  const { profile } = useSelector((state: RootState) => state.user);
  const { type, isOpen, openFileDialog, gifModalIsOpen, feelingsIsOpen, openVideoDialog } = useSelector((state: RootState) => state.modal);
  const { post } = useSelector((state: RootState) => state.post);
  const dispatch = useDispatch<AppDispatch>();
  const [selectedPostImage, setSelectedPostImage] = useState<File | null>(null);
  const [selectedPostVideo, setSelectedPostVideo] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const openPostModal = () => {
    dispatch(openModal({ type: 'add' }));
  };

  const openImageModal = () => {
    fileInputRef.current?.click();
    dispatch(openModal({ type: 'add' }));
    dispatch(toggleImageModal(!openFileDialog));
  };

  const openVideoModal = () => {
    videoInputRef.current?.click();
    dispatch(openModal({ type: 'add' }));
    dispatch(toggleVideoModal(!openVideoDialog));
  };

  const openGifModal = () => {
    dispatch(openModal({ type: 'add' }));
    dispatch(toggleGifModal(!gifModalIsOpen));
  };

  const openFeelingsComponent = () => {
    dispatch(openModal({ type: 'add' }));
    dispatch(toggleFeelingModal(!feelingsIsOpen));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    ImageUtils.addFileToRedux(event, post, setSelectedPostImage, dispatch, 'image');
  };

  const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    ImageUtils.addFileToRedux(event, post, setSelectedPostVideo, dispatch, 'video');
  };

  return (
    <>
      <div className="post-form" data-testid="post-form">
        <div className="post-form-row">
          <div className="post-form-header">
            <h4 className="post-form-title">Create Post</h4>
          </div>
          <div className="post-form-body">
            <div className="post-form-input-body" data-testid="input-body" onClick={openPostModal}>
              <Avatar
                name={profile?.username}
                bgColor={profile?.avatarColor}
                textColor="#ffffff"
                size={50}
                avatarSrc={profile?.profilePicture}
              />
              <div className="post-form-input" data-placeholder="Write something here..."></div>
            </div>
            <hr />
            <ul className="post-form-list" data-testid="list-item">
              <li className="post-form-list-item image-select" onClick={openImageModal}>
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
              <li className="post-form-list-item image-select" onClick={openVideoModal}>
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
                <FaVideo /> Video
              </li>
              <li className="post-form-list-item" onClick={openGifModal}>
                <img src={gif} alt="" /> Gif
              </li>
              <li className="post-form-list-item" onClick={openFeelingsComponent}>
                <img src={feeling} alt="" /> Feeling
              </li>
            </ul>
          </div>
        </div>
      </div>
      {isOpen && type === 'add' && <AddPost selectedImage={selectedPostImage} selectedPostVideo={selectedPostVideo} />}
      {isOpen && type === 'edit' && <EditPost />}
    </>
  );
};

export default PostForm;

