import PropTypes from 'prop-types';
import { useState } from 'react';
import '@components/toggle/Toggle.scss';

interface ToggleProps {
  toggle: boolean;
  onClick?: () => void;
}

const Toggle = ({ toggle, onClick }: ToggleProps) => {
  const [toggleValue, setToggleValue] = useState(toggle);

  return (
    <label className="switch" htmlFor="switch" data-testid="toggle" onClick={onClick}>
      <input
        id="switch"
        type="checkbox"
        checked={toggleValue}
        onChange={() => setToggleValue((toggleValue) => !toggleValue)}
        placeholder="Switch"
      />
      <span className="slider round"></span>
    </label>
  );
};

Toggle.propTypes = {
  toggle: PropTypes.bool.isRequired,
  onClick: PropTypes.func
};

export default Toggle;

