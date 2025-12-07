import { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Utils } from '@services/utils/utils.service';
import { PostUtils } from '@services/utils/post-utils.service';
import { postService } from '@services/api/post/post.service';
import { followerService } from '@services/api/followers/follower.service';
import { GalleryImage } from '@components/gallery-image';
import ImageModal from '@components/image-modal/ImageModal';
import useEffectOnce from '@hooks/useEffectOnce';
import type { RootState, AppDispatch } from '@redux/store';
import './Photos.scss';

interface PostData {
  _id?: string;
  userId?: string;
  imgId?: string;
  imgVersion?: string;
  gifUrl?: string;
  image?: string;
  username?: string;
  avatarColor?: string;
  profilePicture?: string;
  createdAt?: string | Date;
  [key: string]: unknown;
}

const Photos = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profile } = useSelector((state: RootState) => state.user);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [following, setFollowing] = useState<unknown[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [rightImageIndex, setRightImageIndex] = useState<number>();
  const [leftImageIndex, setLeftImageIndex] = useState<number>();
  const [lastItemRight, setLastItemRight] = useState(false);
  const [lastItemLeft, setLastItemLeft] = useState(false);
  const [loading, setLoading] = useState(true);

  const getPostsWithImages = async () => {
    try {
      const response = await postService.getPostsWithImages(1);
      setPosts(response.data.posts);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      Utils.dispatchNotification(error?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  const getUserFollowing = async () => {
    try {
      const response = await followerService.getUserFollowing();
      setFollowing(response.data.following);
    } catch (error: any) {
      Utils.dispatchNotification(error?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  const postImageUrl = (post: PostData) => {
    const imgUrl = Utils.getImage(post?.imgId, post?.imgVersion);
    return post?.gifUrl ? post?.gifUrl : imgUrl;
  };

  const emptyPost = (post: PostData) => {
    return Utils.checkIfUserIsBlocked((profile?.blockedBy as string[]) || [], post?.userId);
  };

  const displayImage = (post: PostData) => {
    const imgUrl = post?.gifUrl ? post?.gifUrl : Utils.getImage(post?.imgId, post?.imgVersion);
    setImageUrl(imgUrl);
  };

  // Filter posts that have images and aren't blocked for navigation
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const hasImage = post?.imgId || post?.gifUrl;
      const isBlocked = Utils.checkIfUserIsBlocked((profile?.blockedBy as string[]) || [], post?.userId);
      const notBlocked = !isBlocked || post?.userId === profile?._id;
      return hasImage && notBlocked && PostUtils.checkPrivacy(post, profile, following);
    });
  }, [posts, profile, following]);

  const onClickRight = () => {
    setLastItemLeft(false);
    setRightImageIndex((index) => {
      const nextIndex = (index ?? 0) + 1;
      const lastImage = filteredPosts[filteredPosts.length - 1];
      const post = filteredPosts[nextIndex];
      if (post) {
        displayImage(post);
        setLeftImageIndex(nextIndex);
        if (post === lastImage) {
          setLastItemRight(true);
        }
      }
      return nextIndex;
    });
  };

  const onClickLeft = () => {
    setLastItemRight(false);
    setLeftImageIndex((index) => {
      const nextIndex = (index ?? 0) - 1;
      const firstImage = filteredPosts[0];
      const post = filteredPosts[nextIndex];
      if (post) {
        displayImage(post);
        setRightImageIndex(nextIndex);
        if (firstImage === post) {
          setLastItemLeft(true);
        }
      }
      return nextIndex;
    });
  };

  useEffectOnce(() => {
    getPostsWithImages();
    getUserFollowing();
  });

  return (
    <>
      <div className="photos-container">
        {showImageModal && (
          <ImageModal
            image={`${imageUrl}`}
            showArrow={true}
            onClickRight={onClickRight}
            onClickLeft={onClickLeft}
            lastItemLeft={lastItemLeft}
            lastItemRight={lastItemRight}
            onCancel={() => {
              setRightImageIndex(0);
              setLeftImageIndex(0);
              setLastItemRight(false);
              setLastItemLeft(false);
              setShowImageModal(false);
            }}
          />
        )}
        <div className="photos">Photos</div>
        {filteredPosts.length > 0 && (
          <div className="gallery-images">
            {filteredPosts.map((post, index) => {
              return (
                <div
                  key={post._id || Utils.generateString(10)}
                  data-testid="gallery-images"
                >
                  <GalleryImage
                    post={post}
                    showCaption={true}
                    showDelete={false}
                    imgSrc={postImageUrl(post)}
                    onClick={() => {
                      setRightImageIndex(index + 1);
                      setLeftImageIndex(index);
                      setLastItemLeft(index === 0);
                      setLastItemRight(index + 1 === filteredPosts.length);
                      setImageUrl(postImageUrl(post));
                      setShowImageModal(true);
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
        {loading && filteredPosts.length === 0 && (
          <div className="gallery-images">
            <div className="empty-page">Loading photos...</div>
          </div>
        )}
        {!loading && filteredPosts.length === 0 && (
          <div className="empty-page" data-testid="empty-page">
            There are no photos to display
          </div>
        )}
      </div>
    </>
  );
};

export default Photos;
