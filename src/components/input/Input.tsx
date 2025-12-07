import { forwardRef } from 'react';
import './Input.sass';

interface InputProps {
  id?: string;
  name: string;
  type: string;
  value?: string | boolean;
  className?: string;
  labelText?: string;
  placeholder?: string;
  style?: React.CSSProperties;
  accept?: string;
  handleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ 
  id,
  name, 
  type, 
  value, 
  className, 
  labelText, 
  placeholder, 
  style,
  accept,
  handleChange,
  onClick,
  onFocus,
  onBlur
}, ref) => {
  return (
    <div className="form-row">
      {labelText && (
        <label htmlFor={id || name} className="form-label">
          {labelText}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        name={name}
        type={type}
        value={typeof value === 'boolean' ? undefined : value}
        checked={typeof value === 'boolean' ? value : undefined}
        accept={accept}
        onChange={handleChange}
        placeholder={placeholder}
        onClick={onClick}
        onFocus={onFocus}
        onBlur={onBlur}
        className={`form-input ${className || ''}`}
        style={style}
        autoComplete="false"
      />
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

