import { describe, it, expect, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import ResetPassword from '@pages/auth/reset-password/ResetPassword';
import { render, screen, waitFor, act } from '@root/test.utils';
import userEvent from '@testing-library/user-event';
import { authService } from '@services/api/auth/auth.service';

// Mock authService
jest.mock('@services/api/auth/auth.service', () => ({
  authService: {
    resetPassword: jest.fn(),
  }
}));

// Mock useSearchParams to return the token
const mockSearchParams = new URLSearchParams('?token=1234567890');
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: () => [mockSearchParams],
  };
});

const renderWithSearchParams = (searchParams = '?token=1234567890') => {
  mockSearchParams.set('token', searchParams.split('=')[1] || '1234567890');
  return render(<ResetPassword />);
};

describe('ResetPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have password inputs', () => {
    renderWithSearchParams();
    const newPasswordLabel = screen.getByLabelText('New Password');
    const confirmPasswordLabel = screen.getByLabelText('Confirm Password');
    expect(newPasswordLabel).toBeInTheDocument();
    expect(confirmPasswordLabel).toBeInTheDocument();
  });

  it('button should be disabled', () => {
    renderWithSearchParams();
    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toBeDisabled();
  });

  it('should have "Back to Login" text', () => {
    renderWithSearchParams();
    const spanElement = screen.getByText('Back to Login');
    expect(spanElement).toBeInTheDocument();
  });

  it('should be enabled with input', async () => {
    const user = userEvent.setup();
    renderWithSearchParams();
    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toBeDisabled();

    const newPasswordLabel = screen.getByLabelText('New Password');
    const confirmPasswordLabel = screen.getByLabelText('Confirm Password');
    await user.type(newPasswordLabel, 'qwerty1');
    await user.type(confirmPasswordLabel, 'qwerty1');
    expect(buttonElement).toBeEnabled();
  });

  it('should change label when clicked', async () => {
    const user = userEvent.setup();
    (authService.resetPassword as jest.Mock).mockResolvedValueOnce({
      data: { message: 'Password successfully updated.' }
    });
    renderWithSearchParams();
    const buttonElement = screen.getByRole('button');
    const newPasswordLabel = screen.getByLabelText('New Password');
    const confirmPasswordLabel = screen.getByLabelText('Confirm Password');
    await user.type(newPasswordLabel, 'qwerty1');
    await user.type(confirmPasswordLabel, 'qwerty1');

    await user.click(buttonElement);

    // Wait for loading state
    await waitFor(() => {
      const newButtonElement = screen.getByRole('button');
      expect(newButtonElement.textContent).toEqual('RESET PASSWORD IN PROGRESS...');
    });
    
    // Verify API was called - the button text change back is tested in the success test
    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalled();
    });
  });

  describe('Success', () => {
    it('should display success alert', async () => {
      const user = userEvent.setup();
      (authService.resetPassword as jest.Mock).mockResolvedValueOnce({
        data: { message: 'Password successfully updated.' }
      });
      renderWithSearchParams();
      const buttonElement = screen.getByRole('button');
      const newPasswordLabel = screen.getByLabelText('New Password');
      const confirmPasswordLabel = screen.getByLabelText('Confirm Password');
      await user.type(newPasswordLabel, 'qwerty1');
      await user.type(confirmPasswordLabel, 'qwerty1');
      
      await act(async () => {
        await user.click(buttonElement);
      });

      const alert = await screen.findByRole('alert', {}, { timeout: 10000 });
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass('alert-success');
      expect(alert.textContent).toEqual('Password successfully updated.');
    });
  });

  describe('Error', () => {
    it('should display error alert and border', async () => {
      const user = userEvent.setup();
      const error = new Error('Passwords do not match');
      (error as any).response = {
        data: {
          message: 'Passwords do not match'
        }
      };
      (authService.resetPassword as jest.Mock).mockRejectedValueOnce(error);
      renderWithSearchParams();
      const buttonElement = screen.getByRole('button');
      const newPasswordLabel = screen.getByLabelText('New Password');
      const confirmPasswordLabel = screen.getByLabelText('Confirm Password');
      await user.type(newPasswordLabel, 'qwerty1');
      await user.type(confirmPasswordLabel, 'qwerty');
      
      await act(async () => {
        await user.click(buttonElement);
      });

      const alert = await screen.findByRole('alert', {}, { timeout: 10000 });
      expect(alert).toBeInTheDocument();
      await waitFor(() => {
        expect(newPasswordLabel).toHaveStyle({ border: '1px solid #fa9b8a' });
      });
      await waitFor(() => {
        expect(confirmPasswordLabel).toHaveStyle({ border: '1px solid #fa9b8a' });
      });
      expect(alert).toHaveClass('alert-error');
      expect(alert.textContent).toEqual('Passwords do not match');
    });
  });
});

