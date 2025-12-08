import { describe, it, expect, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen, waitFor, act } from '@root/test.utils';
import userEvent from '@testing-library/user-event';
import Register from '@pages/auth/register/Register';
import { Utils } from '@services/utils/utils.service';
import { authService } from '@services/api/auth/auth.service';

// Mock authService
jest.mock('@services/api/auth/auth.service', () => ({
  authService: {
    signUp: jest.fn(),
  }
}));

const mockedUseNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedUseNavigate
  };
});

describe('Register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
      const buttonElement = screen.getByRole('button', { name: /signup/i });
      expect(buttonElement).toBeDisabled();
    });

    it('should be enabled with input values', async () => {
      const user = userEvent.setup();
      jest.spyOn(Utils, 'generateAvatar').mockReturnValue('avatar image');
      (authService.signUp as jest.Mock).mockResolvedValue({
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
      } as { data: { message: string; user: Record<string, unknown>; token: string } });

      render(<Register />);
      const buttonElement = screen.getByRole('button', { name: /signup/i });
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
      jest.spyOn(Utils, 'generateAvatar').mockReturnValue('avatar image');
      (authService.signUp as jest.Mock).mockResolvedValueOnce({
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
      } as { data: { message: string; user: Record<string, unknown>; token: string } });

      render(<Register />);
      const buttonElement = screen.getByRole('button', { name: /signup/i });
      const usernameLabel = screen.getByLabelText('Username');
      const emailLabel = screen.getByLabelText('Email');
      const passwordLabel = screen.getByLabelText('Password');

      await user.type(usernameLabel, 'manny');
      await user.type(emailLabel, 'manny@test.com');
      await user.type(passwordLabel, 'qwerty');

      await user.click(buttonElement);

      // Wait for loading state
      await waitFor(() => {
        const newButtonElement = screen.getByRole('button', { name: /signup in progress/i });
        expect(newButtonElement.textContent).toEqual('SIGNUP IN PROGRESS...');
      });
      
      // Verify API was called
      await waitFor(() => {
        expect(authService.signUp).toHaveBeenCalled();
      });
    });
  });

  describe('Success', () => {
    it('should navigate to streams page', async () => {
      const user = userEvent.setup();
      (authService.signUp as jest.Mock).mockResolvedValueOnce({
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
      });

      render(<Register />);
      const buttonElement = screen.getByRole('button', { name: /signup/i });
      const usernameElement = screen.getByLabelText('Username');
      const emailElement = screen.getByLabelText('Email');
      const passwordElement = screen.getByLabelText('Password');

      await user.type(usernameElement, 'manny');
      await user.type(emailElement, 'manny@test.com');
      await user.type(passwordElement, 'qwerty');

      await act(async () => {
        await user.click(buttonElement);
      });

      // Wait for API call to complete
      await waitFor(() => {
        expect(authService.signUp).toHaveBeenCalled();
      });

      // Register now sets loading to false on success (like Login)
      // useEffect: if (loading && !user) return; if (user) navigate
      // After setLoading(false) and setUser (via Utils.dispatchUser), navigation should happen
      await waitFor(() => {
        expect(mockedUseNavigate).toHaveBeenCalledWith('/app/social/streams');
      }, { timeout: 10000 });
    });
  });

  describe('Error', () => {
    it('should display error alert and border', async () => {
      const user = userEvent.setup();
      const error = new Error('Invalid credentials') as Error & { response?: { data?: { message?: string } } };
      error.response = {
        data: {
          message: 'Invalid credentials'
        }
      };
      (authService.signUp as jest.Mock).mockRejectedValueOnce(error);
      jest.spyOn(Utils, 'generateAvatar').mockReturnValue('avatar image');

      render(<Register />);
      const buttonElement = screen.getByRole('button', { name: /signup/i });
      const usernameElement = screen.getByLabelText('Username');
      const emailElement = screen.getByLabelText('Email');
      const passwordElement = screen.getByLabelText('Password');

      await user.type(usernameElement, 'manny');
      await user.type(emailElement, 'manny@test.com');
      await user.type(passwordElement, 'qwerty');

      await act(async () => {
        await user.click(buttonElement);
      });

      const alert = await screen.findByRole('alert', {}, { timeout: 10000 });
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toContain('Invalid credentials');

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

