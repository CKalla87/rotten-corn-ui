import PostForm from '@components/posts/post-form/PostForm';
import PostFormSkeleton from '@components/posts/post-form/PostFormSkeleton';
import Post from '@components/posts/post/Post';
import PostSkeleton from '@components/posts/post/PostSkeleton';
import CountContainer from '@components/timeline/CountContainer';
import BasicInfo from '@components/timeline/BasicInfo';
import SocialLinks from '@components/timeline/SocialLinks';
import '@components/timeline/Timeline.scss';
import { followerService } from '@services/api/followers/follower.service';
import { postService } from '@services/api/post/post.service';
import { PostUtils } from '@services/utils/post-utils.service';
import { Utils } from '@services/utils/utils.service';
import { addReactions } from '@redux/reducers/post/userPostReactionSlice';
import PropTypes from 'prop-types';
import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import useEffectOnce from '@hooks/useEffectOnce';
import useLocalStorage from '@hooks/useLocalStorage';
import type { RootState, AppDispatch } from '@redux/store';

interface TimelineProps {
  userProfileData?: Record<string, unknown>;
  loading?: boolean;
}

const Timeline = ({ userProfileData, loading }: TimelineProps) => {
  const { profile } = useSelector((state: RootState) => state.user);
  const [posts, setPosts] = useState<unknown[]>([]);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [following, setFollowing] = useState<unknown[]>([]);
  const [editableInputs, setEditableInputs] = useState({
    quote: '',
    work: '',
    school: '',
    location: ''
  });
  const [editableSocialInputs, setEditableSocialInputs] = useState({
    instagram: '',
    twitter: '',
    facebook: '',
    youtube: ''
  });
  const { username } = useParams<{ username: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const storedUsername = useLocalStorage<string>('username', 'get');

  const getUserFollowing = async () => {
    try {
      const response = await followerService.getUserFollowing();
      setFollowing(response.data.following);
    } catch (error: any) {
      Utils.dispatchNotification(error?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  const getUserByUsername = useCallback(() => {
    if (userProfileData) {
      setPosts((userProfileData.posts as unknown[]) || []);
      setUser((userProfileData.user as Record<string, unknown>) || null);
      setEditableInputs({
        quote: (userProfileData.user as { quote?: string })?.quote || '',
        work: (userProfileData.user as { work?: string })?.work || '',
        school: (userProfileData.user as { school?: string })?.school || '',
        location: (userProfileData.user as { location?: string })?.location || ''
      });
      setEditableSocialInputs((userProfileData.user as { social?: Record<string, unknown> })?.social || {
        instagram: '',
        twitter: '',
        facebook: '',
        youtube: ''
      });
    }
  }, [userProfileData]);

  const getReactionsByUsername = async () => {
    try {
      const reactionsResponse = await postService.getReactionsByUsername(storedUsername as string);
      dispatch(addReactions(reactionsResponse.data.reactions));
    } catch (error: any) {
      Utils.dispatchNotification(error?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  useEffectOnce(() => {
    getUserFollowing();
    getReactionsByUsername();
  });

  useEffect(() => {
    if (username !== profile?.username) {
      const firstPost = document.querySelectorAll('.post-body')[0];
      console.log(firstPost);
      if (firstPost) {
        (firstPost as HTMLElement).style.marginTop = '0px';
      }
    }
  }, [username, profile]);

  useEffect(() => {
    getUserByUsername();
  }, [getUserByUsername]);

  useEffect(() => {
    PostUtils.socketIOPost(posts, setPosts);
  }, [posts]);

  return (
    <div className="timeline-wrapper" data-testid="timeline">
      <div className="timeline-wrapper-container">
        <div className="timeline-wrapper-container-side">
          <div className="timeline-wrapper-container-side-count">
            <CountContainer
              followersCount={(user as { followersCount?: number })?.followersCount}
              followingCount={(user as { followingCount?: number })?.followingCount}
              loading={loading}
            />
          </div>
          <div className="side-content">
            <BasicInfo
              setEditableInputs={setEditableInputs}
              editableInputs={editableInputs}
              username={username}
              profile={profile}
              loading={loading}
              editableSocialInputs={editableSocialInputs}
              setEditableSocialInputs={setEditableSocialInputs}
            />
          </div>
          <div className="side-content">
            <SocialLinks
              setEditableSocialInputs={setEditableSocialInputs}
              editableSocialInputs={editableSocialInputs}
              username={username}
              profile={profile}
              loading={loading}
            />
          </div>
        </div>
        {loading && !posts.length && (
          <div className="timeline-wrapper-container-main">
            <div style={{ marginBottom: '10px' }}>
              <PostFormSkeleton />
            </div>
            {[1, 2, 3, 4, 5].map((index) => (
              <div key={index}>
                <PostSkeleton />
              </div>
            ))}
          </div>
        )}
        {!loading && posts.length > 0 && (
          <div className="timeline-wrapper-container-main">
            {username === profile?.username && (
              <div style={{ marginBottom: '10px' }}>
                <PostForm />
              </div>
            )}
            {posts.map((post: any) => (
              <div key={post?._id} data-testid="posts-item">
                {(!Utils.checkIfUserIsBlocked((profile?.blockedBy as string[]) || [], post?.userId) ||
                  post?.userId === profile?._id) && (
                  <>
                    {PostUtils.checkPrivacy(post, profile || {}, following as any[]) && (
                      <Post post={post} showIcons={username === profile?.username} />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        {!loading && !posts.length && (
          <div className="timeline-wrapper-container-main">
            <div className="empty-page" data-testid="empty-page">
              Np post available
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

Timeline.propTypes = {
  userProfileData: PropTypes.object,
  loading: PropTypes.bool
};

export default Timeline;
