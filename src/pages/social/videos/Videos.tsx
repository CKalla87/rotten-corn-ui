import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Utils } from '@services/utils/utils.service';
import { PostUtils } from '@services/utils/post-utils.service';
import { postService } from '@services/api/post/post.service';
import { followerService } from '@services/api/followers/follower.service';
import ImageModal from '@components/image-modal/ImageModal';
import useEffectOnce from '@hooks/useEffectOnce';
import type { RootState, AppDispatch } from '@redux/store';
import './Videos.scss';

interface PostData {
  _id?: string;
  userId?: string;
  videoId?: string;
  videoVersion?: string;
  gifUrl?: string;
  image?: string;
  username?: string;
  avatarColor?: string;
  profilePicture?: string;
  createdAt?: string | Date;
  [key: string]: unknown;
}

const Videos = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profile } = useSelector((state: RootState) => state.user);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [following, setFollowing] = useState<unknown[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastItemRight, setLastItemRight] = useState(false);
  const [lastItemLeft, setLastItemLeft] = useState(false);
  const [, setRightImageIndex] = useState<number>(0);
  const [, setLeftImageIndex] = useState<number>(0);

  const getPostsWithVideos = async () => {
    try {
      const response = await postService.getPostsWithVideos(1);
      setPosts(response.data.posts);
      setLoading(false);
    } catch (error: unknown) {
      setLoading(false);
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  const getUserFollowing = async () => {
    try {
      const response = await followerService.getUserFollowing();
      setFollowing(response.data.following);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  const emptyPost = (post: PostData) => {
    return (
      Utils.checkIfUserIsBlocked((profile?.blockedBy as string[]) || [], post?.userId || '') ||
      !PostUtils.checkPrivacy(post, profile || {}, following)
    );
  };

  const displayImage = (post: PostData) => {
    const videoUrl = Utils.getVideo(post?.videoId, post?.videoVersion);
    setImageUrl(videoUrl);
  };

  const onClickLeft = () => {
    setLastItemRight(false);
    setLeftImageIndex((index) => {
      const nextIndex = (index ?? 0) + 1;
      const firstImage = posts[0];
      const post = posts[nextIndex - 1];
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

  const onClickRight = () => {
    setLastItemLeft(false);
    setRightImageIndex((index) => {
      const nextIndex = (index ?? 0) + 1;
      const lastImage = posts[posts.length - 1];
      const post = posts[nextIndex];
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

  useEffectOnce(() => {
    getPostsWithVideos();
    getUserFollowing();
  });

  return (
    <>
      <div className="videos-container">
        {showImageModal && (
          <ImageModal
            image={imageUrl || ''}
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
        <div className="videos">Videos</div>
        {posts.length > 0 && (
          <div className="gallery-videos">
            {posts.map((post) => (
              <div
                key={Utils.generateString(10)}
                className={`${!emptyPost(post) ? 'empty-post-div' : ''}`}
                data-testid="gallery-videos"
              >
                {(!Utils.checkIfUserIsBlocked((profile?.blockedBy as string[]) || [], post?.userId || '') ||
                  post?.userId === profile?._id) && (
                  <>
                    {PostUtils.checkPrivacy(post, profile || {}, following) && (
                      <figure className="gallery-video" data-testid="video">
                        <div className="video">
                          <video
                            width="350px"
                            height="200px"
                            controls
                            src={`${Utils.getVideo(post?.videoId, post?.videoVersion)}`}
                          />
                        </div>
                      </figure>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        {loading && !posts.length && <div className="card-element" style={{ height: '350px' }}></div>}
        {!loading && !posts.length && (
          <div className="empty-page" data-testid="empty-page">
            There are no videos to display
          </div>
        )}
      </div>
    </>
  );
};

export default Videos;

