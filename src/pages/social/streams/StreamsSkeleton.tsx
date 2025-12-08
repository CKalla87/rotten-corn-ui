import './Streams.scss';
import { PostFormSkeleton } from '@components/posts/post-form';
import { PostSkeleton } from '@components/posts/post';
import { SuggestionsSkeleton } from '@components/suggestions';

const StreamsSkeleton = () => {
  return (
    <div className="streams" data-testid="streams">
      <div className="streams-content">
        <div className="streams-post">
          <PostFormSkeleton />
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <PostSkeleton key={index} />
          ))}
        </div>
        <div className="streams-suggestions">
          <SuggestionsSkeleton />
        </div>
      </div>
    </div>
  );
};

export default StreamsSkeleton;
