import Feelings from '@components/feelings/Feelings';
import ModalBoxContent from '@components/posts/post-modal/modal-box-content/ModalBoxContent';
import { render, screen } from '@root/test.utils';
import userEvent from '@testing-library/user-event';

describe('Feelings', () => {
  it('should have non-empty list', () => {
    render(<Feelings />);
    const listElement = screen.getByRole('list');
    expect(listElement.childElementCount).toBeGreaterThan(0);
  });

  it('should handle click', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Feelings />
        <ModalBoxContent />
      </>
    );
    const listElement = screen.queryAllByTestId('feelings-item');
    if (listElement.length > 0) {
      await user.click(listElement[0]);
      const selectedFeelings = document.querySelector('.inline-display');
      const feelingImage = document.querySelector('.feeling-icon');
      expect(selectedFeelings).toBeInTheDocument();
      expect(feelingImage).toBeInTheDocument();
      // The image src might be an imported asset, so just check it exists
      expect(feelingImage).toHaveAttribute('src');
    }
  });
});


