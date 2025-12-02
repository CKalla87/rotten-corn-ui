import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@root/test.utils';
import userEvent from '@testing-library/user-event';
import Register from '@pages/auth/register/Register';
import { Utils } from '@services/utils/utils.service';
import { authService } from '@services/api/auth/auth.service';
import { server } from '@mocks/server';
import { signUpMockError } from '@mocks/handlers/auth';

const mockedUseNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedUseNavigate
  };
});

describe('Register', () => {
  it('signup form should have its labels', () => {
    render(<Register />);
    const usernameLabel = screen.getByLabelText('Username');
    const emailLabel = screen.getByLabelText('Email');
    const passwordLabel = screen.getByLabelText('Password');

    expect(usernameLabel).toBeInTheDocument();
    expect(emailLabel).toBeInTheDocument();
    expect(passwordLabel).toBeInTheDocument();
  });

  describe('Button', () => {
    it('should be disabled', () => {
      render(<Register />);
      const buttonElement = screen.getByRole('button');
      expect(buttonElement).toBeDisabled();
    });

    it('should be enabled with input values', async () => {
      const user = userEvent.setup();
      vi.spyOn(Utils, 'generateAvatar').mockReturnValue('avatar image');
      vi.spyOn(authService, 'signUp').mockResolvedValue({
        data: {
          message: 'User created successfully',
          user: {
            _id: '60263f14648fed5246e322d9',
            username: 'manny',
            email: 'manny@test.com',
            avatarColor: '#4caf50',
            avatarImage: 'https://avatar-placeholder.herokuapp.com/'
          },
          token: 'token123'
        }
      } as any);

      render(<Register />);
      const buttonElement = screen.getByRole('button');
      const usernameLabel = screen.getByLabelText('Username');
      const emailLabel = screen.getByLabelText('Email');
      const passwordLabel = screen.getByLabelText('Password');

      await user.type(usernameLabel, 'manny');
      await user.type(emailLabel, 'manny@test.com');
      await user.type(passwordLabel, 'qwerty');

      expect(buttonElement).toBeEnabled();
    });

    it('should change label when clicked', async () => {
      const user = userEvent.setup();
      vi.spyOn(Utils, 'generateAvatar').mockReturnValue('avatar image');
      vi.spyOn(authService, 'signUp').mockResolvedValue({
        data: {
          message: 'User created successfully',
          user: {
            _id: '60263f14648fed5246e322d9',
            username: 'manny',
            email: 'manny@test.com',
            avatarColor: '#4caf50',
            avatarImage: 'https://avatar-placeholder.herokuapp.com/'
          },
          token: 'token123'
        }
      } as any);

      render(<Register />);
      const buttonElement = screen.getByRole('button');
      const usernameLabel = screen.getByLabelText('Username');
      const emailLabel = screen.getByLabelText('Email');
      const passwordLabel = screen.getByLabelText('Password');

      await user.type(usernameLabel, 'manny');
      await user.type(emailLabel, 'manny@test.com');
      await user.type(passwordLabel, 'qwerty');

      await user.click(buttonElement);

      await waitFor(() => {
        const newButtonElement = screen.getByRole('button');
        expect(newButtonElement.textContent).toEqual('SIGNUP IN PROGRESS...');
      });
    });
  });

  describe('Success', () => {
    it('should navigate to streams page', async () => {
      const user = userEvent.setup();
      vi.spyOn(Utils, 'generateAvatar').mockReturnValue('avatar image');

      render(<Register />);
      const buttonElement = screen.getByRole('button');
      const usernameElement = screen.getByLabelText('Username');
      const emailElement = screen.getByLabelText('Email');
      const passwordElement = screen.getByLabelText('Password');

      await user.type(usernameElement, 'manny');
      await user.type(emailElement, 'manny@test.com');
      await user.type(passwordElement, 'qwerty');

      await user.click(buttonElement);

      await waitFor(() => {
        expect(mockedUseNavigate).toHaveBeenCalledWith('/app/social/streams');
      });
    });
  });

  describe('Error', () => {
    it('should display error alert and border', async () => {
      const user = userEvent.setup();
      server.use(signUpMockError);
      vi.spyOn(Utils, 'generateAvatar').mockReturnValue('avatar image');

      render(<Register />);
      const buttonElement = screen.getByRole('button');
      const usernameElement = screen.getByLabelText('Username');
      const emailElement = screen.getByLabelText('Email');
      const passwordElement = screen.getByLabelText('Password');

      await user.type(usernameElement, 'manny');
      await user.type(emailElement, 'manny@test.com');
      await user.type(passwordElement, 'qwerty');

      await user.click(buttonElement);

      const alert = await screen.findByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toEqual('Invalid credentials');

      await waitFor(() => {
        expect(usernameElement).toHaveStyle({ border: '1px solid #fa9b8a' });
      });
      await waitFor(() => {
        expect(emailElement).toHaveStyle({ border: '1px solid #fa9b8a' });
      });
      await waitFor(() => {
        expect(passwordElement).toHaveStyle({ border: '1px solid #fa9b8a' });
      });
    });
  });
});

