interface ButtonProps {
  label: string | React.ReactNode;
  className?: string;
  disabled?: boolean;
  handleClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

const Button = ({ label, className, disabled, handleClick, type = 'button' }: ButtonProps) => {
  return (
    <button 
      type={type}
      className={className} 
      onClick={(e) => {
        // Only prevent default if there's a custom handleClick handler
        // For submit buttons without handleClick, let the form handle submission naturally
        if (handleClick) {
          e.preventDefault();
          e.stopPropagation();
          handleClick(e);
        }
        // If no handleClick and it's a submit button, let the form handle it
        // If no handleClick and it's a regular button, prevent default to avoid any unwanted behavior
        else if (type === 'button') {
          e.preventDefault();
        }
      }}
      disabled={disabled}
    >
      {label}
    </button>
  );
};

export default Button;

