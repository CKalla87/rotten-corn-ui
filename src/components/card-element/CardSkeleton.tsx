import './CardSkeleton.scss';

const CardSkeleton = () => {
  return (
    <div className="card-container">
      <div className="people">People</div>
      <div className="card-element">
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <div className="card-element-item" key={index}>
            <div className="card-element-header">
              <div className="card-element-header-bg"></div>
              <div className="avatar-skeleton"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CardSkeleton;


