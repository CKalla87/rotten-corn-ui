import { useDispatch, useSelector } from 'react-redux';
import { addPostFeeling, toggleFeelingModal } from '@redux/reducers/modal/modalSlice';
import { feelingsList } from '@services/utils/static.data';
import type { RootState } from '@redux/store';
import type { AppDispatch } from '@redux/store';
import type { FeelingItem } from '@services/utils/static.data';
import './Feelings.scss';

const Feelings = () => {
  const { feelingsIsOpen } = useSelector((state: RootState) => state.modal);
  const dispatch = useDispatch<AppDispatch>();

  const selectFeeling = (feeling: FeelingItem) => {
    dispatch(addPostFeeling({ feeling: feeling.name }));
    dispatch(toggleFeelingModal(!feelingsIsOpen));
  };

  return (
    <div className="feelings-container">
      <div className="feelings-container-picker">
        <p>Feelings</p>
        <hr />
        <ul className="feelings-container-picker-list">
          {feelingsList.map((feeling) => (
            <li
              data-testid="feelings-item"
              key={feeling.index}
              className="feelings-container-picker-list-item"
              onClick={() => selectFeeling(feeling)}
            >
              <img src={feeling.image} alt="" />
              <span>{feeling.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Feelings;


