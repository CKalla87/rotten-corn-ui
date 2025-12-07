import GalleryImage from '@components/gallery-image/GalleryImage';
import { render, screen } from '@root/test.utils';
import userEvent from '@testing-library/user-event';

describe('GalleryImage', () => {
  let props: {
    post?: {
      username?: string;
      avatarColor?: string;
      createdAt?: string | Date;
      [key: string]: unknown;
    };
    showCaption?: boolean;
    showDelete?: boolean;
    imgSrc?: string;
    onClick?: () => void;
    onRemoveImage?: () => void;
  };

  beforeEach(() => {
    props = {
      post: {
        username: 'Manny',
        avatarColor: 'red',
        createdAt: '2022-06-14'
      },
      showCaption: false,
      showDelete: false,
      imgSrc: 'https://place-hold.it',
      onClick: null,
      onRemoveImage: null
    };
  });

  it('should show image with no caption', () => {
    render(<GalleryImage {...props} />);
    const imgElement = screen.getByRole('img');
    expect(imgElement).toBeInTheDocument();
    expect(imgElement).toHaveAttribute('src', 'https://place-hold.it');
  });

  it('should show delete icon', async () => {
    const onRemoveClick = jest.fn();
    props.showDelete = true;
    props.onRemoveImage = onRemoveClick;
    const { baseElement } = render(<GalleryImage {...props} />);
    const spanElement = baseElement.querySelector('.gallery-image_delete');
    if (spanElement) {
      await userEvent.click(spanElement as HTMLElement);
    }
    expect(spanElement).toBeInTheDocument();
    expect(onRemoveClick).toHaveBeenCalledTimes(1);
  });

  it('should show image caption', () => {
    props.showCaption = true;
    const { baseElement } = render(<GalleryImage {...props} />);
    const figureElement = baseElement.querySelector('.gallery-image_caption');
    const figureTitleElement = baseElement.querySelector('.figure-title');
    const figureDateElement = baseElement.querySelector('.figure-date');
    expect(figureElement).toBeInTheDocument();
    expect(figureTitleElement).toBeInTheDocument();
    expect(figureDateElement).toBeInTheDocument();
  });
});

