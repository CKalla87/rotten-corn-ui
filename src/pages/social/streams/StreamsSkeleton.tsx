import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import './Streams.scss';
import SuggestionsSkeletons from '@components/suggestions/SuggestionsSkeleton';

const PostFormSkeleton = () => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <Skeleton baseColor="#EFF1F6" height={200} />
    </div>
  );
};

const PostSkeleton = () => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <Skeleton baseColor="#EFF1F6" height={300} />
    </div>
  );
};

const StreamsSkeleton = () => {
  return (
    <div className="streams" data-testid="streams">
      <div className="streams-content">
        <div className="streams-post">
          <PostFormSkeleton />
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <div key={index}>
              <PostSkeleton />
            </div>
          ))}
        </div>
        <div className="streams-suggestions">
          <SuggestionsSkeletons />
        </div>
      </div>
    </div>
  );
};

export default StreamsSkeleton;
