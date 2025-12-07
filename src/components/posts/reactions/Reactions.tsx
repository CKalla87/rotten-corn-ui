import { reactionsMap } from '@services/utils/static.data';
import './Reactions.scss';

interface ReactionsProps {
  handleClick: (reaction: string) => void;
  showLabel?: boolean;
}

const Reactions = ({ handleClick, showLabel = true }: ReactionsProps) => {
  const reactionList = ['like', 'love', 'wow', 'haha', 'sad', 'angry'];

  return (
    <div className="reactions" data-testid="reactions">
      <ul>
        {reactionList.map((reaction, index) => (
          <li key={index} onClick={() => handleClick(reaction)} data-testid="reaction">
            {showLabel && <label>{reaction}</label>}
            <img src={reactionsMap[reaction]} alt="" />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Reactions;

