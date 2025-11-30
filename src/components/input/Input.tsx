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
  handleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Input = ({ 
  id,
  name, 
  type, 
  value, 
  className, 
  labelText, 
  placeholder, 
  style,
  handleChange 
}: InputProps) => {
  return (
    <div className="form-row">
      {labelText && (
        <label htmlFor={id || name} className="form-label">
          {labelText}
        </label>
      )}
      <input
        id={id}
        name={name}
        type={type}
        value={typeof value === 'boolean' ? undefined : value}
        checked={typeof value === 'boolean' ? value : undefined}
        onChange={handleChange}
        placeholder={placeholder}
        className={`form-input ${className || ''}`}
        style={style}
        autoComplete="false"
      />
    </div>
  );
};

export default Input;

