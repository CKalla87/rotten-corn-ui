interface ButtonProps {
  label: string | React.ReactNode;
  className?: string;
  disabled?: boolean;
  handleClick?: () => void;
}

const Button = ({ label, className, disabled, handleClick }: ButtonProps) => {
  return (
    <button 
      className={className} 
      onClick={handleClick} 
      disabled={disabled}
    >
      {label}
    </button>
  );
};

export default Button;

