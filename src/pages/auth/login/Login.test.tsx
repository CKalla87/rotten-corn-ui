import { describe, it, expect, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen, waitFor, act } from '@root/test.utils';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import Login from '@pages/auth/login/Login';
import { authService } from '@services/api/auth/auth.service';

// Mock authService
jest.mock('@services/api/auth/auth.service', () => ({
  authService: {
    signIn: jest.fn(),
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

describe('SigIn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('signin form should have its labels', () => {
    render(<Login />);
    const usernameLabel = screen.getByLabelText('Username');
    const passwordLabel = screen.getByLabelText('Password');
    const checkBoxLabel = screen.getByLabelText('Keep me signed in');
    expect(usernameLabel).toBeInTheDocument();
    expect(passwordLabel).toBeInTheDocument();
    expect(checkBoxLabel).toBeInTheDocument();
  });

  it('checkbox should be unchecked', () => {
    render(<Login />);
    const checkBoxElement = screen.getByLabelText(/Keep me signed in/i);
    expect(checkBoxElement).not.toBeChecked();
  });

  it('checkbox should be checked when clicked', () => {
    render(<Login />);
    const checkBoxElement = screen.getByLabelText('Keep me signed in');
    expect(checkBoxElement).not.toBeChecked();

    fireEvent.click(checkBoxElement);
    expect(checkBoxElement).toBeChecked();
  });

  describe('Button', () => {
    it('should be disabled', () => {
      render(<Login />);
      const buttonElement = screen.getByRole('button', { name: /signin/i });
      expect(buttonElement).toBeDisabled();
    });

    it('should be enabled with inputs', () => {
      render(<Login />);
      const buttonElement = screen.getByRole('button', { name: /signin/i });
      expect(buttonElement).toBeDisabled();
      const usernameElement = screen.getByLabelText('Username');
      const passwordElement = screen.getByLabelText('Password');
      fireEvent.change(usernameElement, { target: { value: 'manny' } });
      fireEvent.change(passwordElement, { target: { value: 'qwerty' } });
      expect(buttonElement).toBeEnabled();
    });

    it('should change label when clicked', async () => {
      const user = userEvent.setup();
      render(<Login />);
      const buttonElement = screen.getByRole('button', { name: /signin/i });
      const usernameElement = screen.getByLabelText('Username');
      const passwordElement = screen.getByLabelText('Password');
      await user.type(usernameElement, 'manny');
      await user.type(passwordElement, 'qwerty');
      await user.click(buttonElement);

      await waitFor(() => {
        const newButtonElement = screen.getByRole('button', { name: /signin in progress/i });
        expect(newButtonElement.textContent).toEqual('SIGNIN IN PROGRESS...');
      });
    });
  });

  describe('Success', () => {
    it('should navigate to streams page', async () => {
      const user = userEvent.setup();
      (authService.signIn as jest.Mock).mockResolvedValueOnce({
        data: {
          user: { 
            _id: '123',
            username: 'manny',
            email: 'manny@test.com',
            avatarColor: '#4caf50',
            avatarImage: ''
          },
          token: 'token123'
        }
      });
      render(<Login />);
      const buttonElement = screen.getByRole('button', { name: /signin/i });
      const usernameElement = screen.getByLabelText('Username');
      const passwordElement = screen.getByLabelText('Password');

      await user.type(usernameElement, 'manny');
      await user.type(passwordElement, 'qwerty');

      await act(async () => {
        await user.click(buttonElement);
      });

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
      (authService.signIn as jest.Mock).mockRejectedValueOnce(error);

      render(<Login />);
      const buttonElement = screen.getByRole('button', { name: /signin/i });
      const usernameElement = screen.getByLabelText('Username');
      const passwordElement = screen.getByLabelText('Password');

      await user.type(usernameElement, 'manny');
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
        expect(passwordElement).toHaveStyle({ border: '1px solid #fa9b8a' });
      });
    });
  });
});

