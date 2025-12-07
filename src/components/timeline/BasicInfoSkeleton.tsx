import Skeleton from 'react-loading-skeleton';
import '@components/timeline/Timeline.scss';

const BasicInfoSkeleton = () => {
  return (
    <div className="side-container" data-testid="basic-info-skeleton">
      <div className="side-container-header">
        <Skeleton baseColor="#EFF1F6" width={100} height={20} />
        <Skeleton baseColor="#EFF1F6" width={50} height={20} />
      </div>
      <div className="side-container-body">
        <Skeleton baseColor="#EFF1F6" width={250} height={70} />
      </div>
      <div className="side-container-body">
        <Skeleton baseColor="#EFF1F6" width={30} height={30} />
        <Skeleton baseColor="#EFF1F6" width={200} height={20} />
      </div>
      <div className="side-container-body">
        <Skeleton baseColor="#EFF1F6" width={30} height={30} />
        <Skeleton baseColor="#EFF1F6" width={200} height={20} />
      </div>
      <div className="side-container-body">
        <Skeleton baseColor="#EFF1F6" width={30} height={30} />
        <Skeleton baseColor="#EFF1F6" width={200} height={20} />
      </div>
    </div>
  );
};

export default BasicInfoSkeleton;


