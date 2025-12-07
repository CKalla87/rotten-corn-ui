import './Spinner.scss';

interface SpinnerProps {
  bgColor?: string;
}

const Spinner = ({ bgColor }: SpinnerProps) => {
  return (
    <>
      <div className="spinner">
        <div className="bounce1" style={{ backgroundColor: `${bgColor || '#50b5ff'}` }}></div>
        <div className="bounce2" style={{ backgroundColor: `${bgColor || '#50b5ff'}` }}></div>
        <div className="bounce3" style={{ backgroundColor: `${bgColor || '#50b5ff'}` }}></div>
      </div>
    </>
  );
};

export default Spinner;


