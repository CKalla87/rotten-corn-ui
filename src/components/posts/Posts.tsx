import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Utils } from '@services/utils/utils.service';
import { PostUtils } from '@services/utils/post-utils.service';
import Post from '@components/posts/post/Post';
import PostSkeleton from '@components/posts/post/PostSkeleton';
import type { RootState } from '@redux/store';
import './Posts.scss';

interface PostsProps {
  allPosts: unknown[];
  userFollowing: unknown[];
  postsLoading: boolean;
}

const Posts = ({ allPosts, userFollowing, postsLoading }: PostsProps) => {
  const { profile } = useSelector((state: RootState) => state.user);
  const [posts, setPosts] = useState<unknown[]>([]);
  const [following, setFollowing] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setPosts(allPosts);
      setFollowing(userFollowing);
      setLoading(postsLoading);
    }, 0);
  }, [allPosts, userFollowing, postsLoading]);

  return (
    <div className="posts-container" data-testid="posts">
      {!loading && posts.length > 0 && (posts as Record<string, unknown>[]).map((post: Record<string, unknown>, index: number) => (
        <div key={(post?._id as string) || index} data-testid="posts-item">
          {(!Utils.checkIfUserIsBlocked((profile?.blockedBy as string[]) || [], post?.userId as string) ||
            post?.userId === profile?._id) && (
            <>
              {profile && PostUtils.checkPrivacy(post, profile, following) && (
                <Post post={post} showIcons={false} />
              )}
            </>
          )}
        </div>
      ))}
      {loading && !posts.length && [1, 2, 3, 4, 5, 6].map((index) => (
        <div key={index}>
          <PostSkeleton />
        </div>
      ))}
    </div>
  );
};

export default Posts;

