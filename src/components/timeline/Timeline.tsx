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
import { socketService } from '@services/socket/socket.service';
import { addReactions } from '@redux/reducers/post/userPostReactionSlice';
import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import useEffectOnce from '@hooks/useEffectOnce';
import useLocalStorage from '@hooks/useLocalStorage';
import type { RootState, AppDispatch } from '@redux/store';

interface TimelineProps {
  userProfileData?: Record<string, unknown>;
  loading?: boolean;
  onIntroUpdateSuccess?: () => Promise<void>;
}

const Timeline = ({ userProfileData, loading, onIntroUpdateSuccess }: TimelineProps) => {
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
  const savedInputsRef = useRef<{ quote: string; work: string; school: string; location: string } | null>(null);
  const savedSocialInputsRef = useRef<{ instagram: string; twitter: string; facebook: string; youtube: string } | null>(null);
  const [editableSocialInputs, setEditableSocialInputs] = useState({
    instagram: '',
    twitter: '',
    facebook: '',
    youtube: ''
  });
  const editableSocialInputsInitializedRef = useRef(false);
  const { username } = useParams<{ username: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const storedUsername = useLocalStorage<string>('username', 'get');

  const getUserFollowing = async () => {
    try {
      const response = await followerService.getUserFollowing();
      setFollowing(response.data.following);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  const getReactionsByUsername = async () => {
    try {
      const reactionsResponse = await postService.getReactionsByUsername(storedUsername as string);
      dispatch(addReactions(reactionsResponse.data.reactions));
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
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

  const userProfileDataRef = useRef<Record<string, unknown> | null>(null);
  const hasInitializedRef = useRef(false);
  const editableInputsInitializedRef = useRef(false);
  const lastUserProfileDataRef = useRef<Record<string, unknown> | null>(null);

  // Helper function to clean text
  const cleanText = (text: string | undefined): string => {
    if (!text) return '';
    // Handle multiple levels of JSON escaping
    let cleaned = text;
    let previousCleaned = '';
    while (cleaned !== previousCleaned) {
      previousCleaned = cleaned;
      cleaned = cleaned.replace(/\\"/g, '"');
      cleaned = cleaned.replace(/\\'/g, "'");
      cleaned = cleaned.replace(/\\\\/g, '\\');
    }
    // Remove surrounding quotes
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1);
    }
    return cleaned.trim();
  };

  useEffect(() => {
    if (userProfileData) {
      // Check if userProfileData actually changed by comparing the user object's intro fields
      const currentUser = userProfileData.user as Record<string, unknown> | undefined;
      
      const lastUser = lastUserProfileDataRef.current?.user as Record<string, unknown> | undefined;
      
      const currentQuote = cleanText(currentUser?.quote as string | undefined);
      const currentWork = cleanText(currentUser?.work as string | undefined);
      const currentSchool = cleanText(currentUser?.school as string | undefined);
      const currentLocation = cleanText(currentUser?.location as string | undefined);
      
      const lastQuote = cleanText(lastUser?.quote as string | undefined);
      const lastWork = cleanText(lastUser?.work as string | undefined);
      const lastSchool = cleanText(lastUser?.school as string | undefined);
      const lastLocation = cleanText(lastUser?.location as string | undefined);
      
      const introDataChanged = 
        currentQuote !== lastQuote ||
        currentWork !== lastWork ||
        currentSchool !== lastSchool ||
        currentLocation !== lastLocation;
      
      // Check if social data changed
      // First try to get social from currentUser, then fall back to Redux profile
      let currentSocial = (currentUser as { social?: Record<string, unknown> })?.social;
      if (!currentSocial && profile?.social) {
        currentSocial = profile.social as Record<string, unknown>;
      }
      
      
      const lastSocial = (lastUser as { social?: Record<string, unknown> })?.social;
      
      // Extract social links, handling null, undefined, and empty string cases
      // The backend might return null for empty links, so we need to handle that
      const currentInstagram = currentSocial?.instagram != null ? String(currentSocial.instagram).trim() : '';
      const currentTwitter = currentSocial?.twitter != null ? String(currentSocial.twitter).trim() : '';
      const currentFacebook = currentSocial?.facebook != null ? String(currentSocial.facebook).trim() : '';
      const currentYoutube = currentSocial?.youtube != null ? String(currentSocial.youtube).trim() : '';
      
      const lastInstagram = String(lastSocial?.instagram || '');
      const lastTwitter = String(lastSocial?.twitter || '');
      const lastFacebook = String(lastSocial?.facebook || '');
      const lastYoutube = String(lastSocial?.youtube || '');
      
      const socialDataChanged = 
        currentInstagram !== lastInstagram ||
        currentTwitter !== lastTwitter ||
        currentFacebook !== lastFacebook ||
        currentYoutube !== lastYoutube;
      
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setPosts((userProfileData.posts as unknown[]) || []);
        setUser(currentUser || null);
        
        // Only update editableInputs on initial load or when intro data actually changed
        // This prevents overwriting user edits that haven't been saved yet
        // Also, don't overwrite if we have saved inputs that match what the user just saved
        const hasSavedInputs = savedInputsRef.current !== null;
        const savedMatchesCurrent = hasSavedInputs && savedInputsRef.current !== null &&
          savedInputsRef.current.quote === currentQuote &&
          savedInputsRef.current.work === currentWork &&
          savedInputsRef.current.school === currentSchool &&
          savedInputsRef.current.location === currentLocation;
        
        if (!editableInputsInitializedRef.current || (introDataChanged && editableInputsInitializedRef.current && !savedMatchesCurrent)) {
        setEditableInputs({
            quote: currentQuote,
            work: currentWork,
            school: currentSchool,
            location: currentLocation
          });
          editableInputsInitializedRef.current = true;
          // Clear saved inputs ref after updating from backend
          if (savedMatchesCurrent) {
            savedInputsRef.current = null;
          }
        }
        
        // Only update editableSocialInputs on initial load or when social data actually changed
        // This prevents overwriting user edits that haven't been saved yet
        // Also, don't overwrite if we have saved social inputs that match what the user just saved
        const hasSavedSocialInputs = savedSocialInputsRef.current !== null;
        const savedSocialMatchesCurrent = hasSavedSocialInputs && savedSocialInputsRef.current !== null &&
          savedSocialInputsRef.current.instagram === currentInstagram &&
          savedSocialInputsRef.current.twitter === currentTwitter &&
          savedSocialInputsRef.current.facebook === currentFacebook &&
          savedSocialInputsRef.current.youtube === currentYoutube;
        
        // Check if this is the first time we're loading userProfileData (page refresh scenario)
        const isFirstLoad = lastUserProfileDataRef.current === null;
        
        // Always initialize on first load (page refresh), or when social data changed and doesn't match saved inputs
        // On first load, always initialize regardless of whether currentSocial exists
        const shouldInitialize = !editableSocialInputsInitializedRef.current || 
          isFirstLoad ||
          (socialDataChanged && editableSocialInputsInitializedRef.current && !savedSocialMatchesCurrent);
        
        if (shouldInitialize) {
          // Check if backend returned all empty strings
          const allEmpty = !currentInstagram && !currentTwitter && !currentFacebook && !currentYoutube;
          
          // If backend returns all empty but we have saved values, use saved values instead
          // This prevents overwriting saved social links when backend hasn't persisted them yet
          let finalInstagram = currentInstagram;
          let finalTwitter = currentTwitter;
          let finalFacebook = currentFacebook;
          let finalYoutube = currentYoutube;
          
          // If backend returns all empty but we have saved values, use saved values instead
          // This prevents overwriting saved social links when backend hasn't persisted them yet
          if (allEmpty && savedSocialInputsRef.current) {
            finalInstagram = savedSocialInputsRef.current.instagram;
            finalTwitter = savedSocialInputsRef.current.twitter;
            finalFacebook = savedSocialInputsRef.current.facebook;
            finalYoutube = savedSocialInputsRef.current.youtube;
          }
          // Also check if we have values in Redux profile that aren't empty
          else if (allEmpty && profile?.social) {
            const profileSocial = profile.social as Record<string, unknown>;
            if (profileSocial.instagram && String(profileSocial.instagram).trim()) {
              finalInstagram = String(profileSocial.instagram).trim();
            }
            if (profileSocial.twitter && String(profileSocial.twitter).trim()) {
              finalTwitter = String(profileSocial.twitter).trim();
            }
            if (profileSocial.facebook && String(profileSocial.facebook).trim()) {
              finalFacebook = String(profileSocial.facebook).trim();
            }
            if (profileSocial.youtube && String(profileSocial.youtube).trim()) {
              finalYoutube = String(profileSocial.youtube).trim();
            }
          }
          
          const newSocialInputs = {
            instagram: finalInstagram,
            twitter: finalTwitter,
            facebook: finalFacebook,
            youtube: finalYoutube
          };
          
          setEditableSocialInputs(newSocialInputs);
          editableSocialInputsInitializedRef.current = true;
          // Clear saved social inputs ref after updating from backend
          if (savedSocialMatchesCurrent) {
            savedSocialInputsRef.current = null;
          }
        }
        
        // Update the ref after processing
        lastUserProfileDataRef.current = userProfileData;
        userProfileDataRef.current = userProfileData;
        hasInitializedRef.current = true;
      }, 0);
    }
  }, [userProfileData, profile?.social]);

  const postsRef = useRef(posts);
  const hasSetupSocketRef = useRef(false);

  // Keep postsRef in sync with posts
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  useEffect(() => {
    // Only set up socket listeners once, not on every posts change
    if (!hasSetupSocketRef.current) {
      PostUtils.socketIOPost(postsRef.current, setPosts);
      hasSetupSocketRef.current = true;
    }

    // Cleanup on unmount
    return () => {
      if (socketService.socket) {
        socketService.socket.off('add post');
        socketService.socket.off('update post');
        socketService.socket.off('delete post');
        socketService.socket.off('update like');
        socketService.socket.off('update comment');
      }
      hasSetupSocketRef.current = false;
    };
  }, []);

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
              setEditableInputs={(inputs: Record<string, unknown>) => {
                setEditableInputs({
                  quote: (inputs.quote as string) || '',
                  work: (inputs.work as string) || '',
                  school: (inputs.school as string) || '',
                  location: (inputs.location as string) || ''
                });
              }}
              editableInputs={editableInputs}
              username={username}
              profile={profile || undefined}
              loading={loading}
              editableSocialInputs={editableSocialInputs}
              setEditableSocialInputs={(inputs: Record<string, unknown>) => {
                setEditableSocialInputs({
                  instagram: (inputs.instagram as string) || '',
                  twitter: (inputs.twitter as string) || '',
                  facebook: (inputs.facebook as string) || '',
                  youtube: (inputs.youtube as string) || ''
                });
              }}
              onUpdateSuccess={async () => {
                // Store the saved inputs so we don't overwrite them during refresh
                savedInputsRef.current = {
                  quote: editableInputs.quote,
                  work: editableInputs.work,
                  school: editableInputs.school,
                  location: editableInputs.location
                };
                // Refresh profile data in the background for consistency
                if (onIntroUpdateSuccess) {
                  await onIntroUpdateSuccess();
                }
              }}
            />
          </div>
          <div className="side-content">
            <SocialLinks
              setEditableSocialInputs={(inputs: Record<string, unknown>) => {
                setEditableSocialInputs({
                  instagram: (inputs.instagram as string) || '',
                  twitter: (inputs.twitter as string) || '',
                  facebook: (inputs.facebook as string) || '',
                  youtube: (inputs.youtube as string) || ''
                });
              }}
              editableSocialInputs={editableSocialInputs}
              username={username}
              profile={profile || undefined}
              loading={loading}
              onUpdateSuccess={async (savedValues) => {
                // Store the saved social inputs so we don't overwrite them during refresh
                // Use the savedValues passed from SocialLinks if available, otherwise fall back to current state
                if (savedValues) {
                  savedSocialInputsRef.current = savedValues;
                } else {
                  savedSocialInputsRef.current = {
                    instagram: editableSocialInputs.instagram,
                    twitter: editableSocialInputs.twitter,
                    facebook: editableSocialInputs.facebook,
                    youtube: editableSocialInputs.youtube
                  };
                }
                // Refresh profile data in the background for consistency
                if (onIntroUpdateSuccess) {
                  await onIntroUpdateSuccess();
                }
              }}
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
            {(posts as Record<string, unknown>[]).map((post: Record<string, unknown>, index: number) => (
              <div key={(post?._id as string) || index} data-testid="posts-item">
                {(!Utils.checkIfUserIsBlocked((profile?.blockedBy as string[]) || [], post?.userId as string) ||
                  post?.userId === profile?._id) && (
                  <>
                    {PostUtils.checkPrivacy(post, profile || {}, following as Array<Record<string, unknown>>) && (
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
