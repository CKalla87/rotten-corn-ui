import { type ReactNode, Children } from 'react';
import './ReactionWrapper.scss';

interface ReactionWrapperProps {
  children: ReactNode;
  closeModal?: () => void;
}

const ReactionWrapper = ({ children, closeModal }: ReactionWrapperProps) => {
  const childrenArray = Children.toArray(children);

  return (
    <div className="modal-wrapper" data-testid="modal-wrapper">
      <div className="modal-wrapper-container">
        <div className="modal-wrapper-container-header">
          {childrenArray[0]}
          {closeModal && (
            <button onClick={closeModal}>X</button>
          )}
        </div>
        <hr />
        <div className="modal-wrapper-container-body" data-testid="modal-body">
          {childrenArray[1]}
        </div>
      </div>
      <div className="modal-bg" data-testid="modal-bg" onClick={closeModal}></div>
    </div>
  );
};

export default ReactionWrapper;


