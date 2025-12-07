import { type ReactNode, Children } from 'react';
import './PostWrapper.scss';

interface PostWrapperProps {
  children: ReactNode;
}

const PostWrapper = ({ children }: PostWrapperProps) => {
  const childrenArray = Children.toArray(children);
  
  return (
    <div className="modal-wrapper" data-testid="post-modal">
      {childrenArray[1]}
      {childrenArray[2]}
      {childrenArray[3]}
      <div className="modal-bg"></div>
    </div>
  );
};

export default PostWrapper;

