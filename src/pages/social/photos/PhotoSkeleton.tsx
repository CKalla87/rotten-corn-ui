import './Photos.scss';

const PhotoSkeleton = () => {
  return (
    <div className="photos-container">
      <div className="photos">Photos</div>
      <div className="gallery-images">
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <div key={index} className="empty-post-div" style={{ width: '352px', height: '352px', backgroundColor: '#f0f0f0', borderRadius: '16px' }}></div>
        ))}
      </div>
    </div>
  );
};

export default PhotoSkeleton;


