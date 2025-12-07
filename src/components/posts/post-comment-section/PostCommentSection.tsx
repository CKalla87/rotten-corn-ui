import CommentArea from '@components/posts/comment-area/CommentArea';
import ReactionsAndCommentsDisplay from '@components/posts/reactions/reactions-and-comments-display/ReactionsAndCommentsDisplay';

interface PostData {
  [key: string]: unknown;
}

interface PostCommentSectionProps {
  post: PostData;
}

const PostCommentSection = ({ post }: PostCommentSectionProps) => {
  return (
    <div data-testid="comment-section">
      <ReactionsAndCommentsDisplay post={post} />
      <CommentArea post={post} />
    </div>
  );
};

export default PostCommentSection;

