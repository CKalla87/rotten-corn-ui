import { type ReactNode, Children, isValidElement } from 'react';
import './ReactionWrapper.scss';

interface ReactionWrapperProps {
  children: ReactNode;
  closeModal?: () => void;
}

const ReactionWrapper = ({ children, closeModal }: ReactionWrapperProps) => {
  const childrenArray = Children.toArray(children);
  const firstChild = childrenArray[0];
  
  // Check if first child is an empty div (no children or empty string)
  let isEmpty = false;
  if (isValidElement(firstChild)) {
    const props = firstChild.props as { children?: ReactNode };
    isEmpty = !props?.children || 
      (typeof props.children === 'string' && props.children.trim() === '') ||
      (Array.isArray(props.children) && props.children.length === 0);
  } else {
    isEmpty = !firstChild;
  }

  return (
    <div className="modal-wrapper" data-testid="modal-wrapper">
      <div className="modal-wrapper-container">
        {!isEmpty && (
          <>
            <div className="modal-wrapper-container-header">
              {childrenArray[0]}
              {closeModal && (
                <button onClick={closeModal}>X</button>
              )}
            </div>
            <hr />
          </>
        )}
        <div className="modal-wrapper-container-body" data-testid="modal-body">
          {childrenArray[1]}
        </div>
      </div>
      <div className="modal-bg" data-testid="modal-bg" onClick={closeModal}></div>
    </div>
  );
};

export default ReactionWrapper;


