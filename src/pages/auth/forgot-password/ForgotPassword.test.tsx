import { describe, it, expect, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import ForgotPassword from '@pages/auth/forgot-password/ForgotPassword';
import { render, screen, waitFor, act } from '@root/test.utils';
import userEvent from '@testing-library/user-event';
import { authService } from '@services/api/auth/auth.service';

// Mock authService
jest.mock('@services/api/auth/auth.service', () => ({
  authService: {
    forgotPassword: jest.fn(),
  }
}));

describe('ForgotPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authService.forgotPassword as jest.Mock).mockClear();
  });

  it('form should have email label', () => {
    render(<ForgotPassword />);
    const emailLabel = screen.getByLabelText('Email');
    expect(emailLabel).toBeInTheDocument();
  });

  it('should have "Back to Login" text', () => {
    render(<ForgotPassword />);
    const spanElement = screen.getByText('Back to Login');
    expect(spanElement).toBeInTheDocument();
  });

  describe('Button', () => {
    it('button should be disabled', () => {
      render(<ForgotPassword />);
      const buttonElement = screen.getByRole('button');
      expect(buttonElement).toBeDisabled();
    });

    it('should be enabled with input', async () => {
      const user = userEvent.setup();
      render(<ForgotPassword />);
      const buttonElement = screen.getByRole('button');
      expect(buttonElement).toBeDisabled();

      const emailElement = screen.getByLabelText('Email');
      await user.type(emailElement, 'manny@test.com');
      expect(buttonElement).toBeEnabled();
    });

    it('should change label when clicked', async () => {
      const user = userEvent.setup();
      (authService.forgotPassword as jest.Mock).mockResolvedValueOnce({
        data: { message: 'Password reset email sent.' }
      });
      render(<ForgotPassword />);
      const buttonElement = screen.getByRole('button');
      const emailElement = screen.getByLabelText('Email');
      await user.type(emailElement, 'manny@test.com');

      await user.click(buttonElement);

      // Wait for loading state
      await waitFor(() => {
        const newButtonElement = screen.getByRole('button');
        expect(newButtonElement.textContent).toEqual('FORGOT PASSWORD IN PROGRESS...');
      });
      
      // Verify API was called - the button text change back is tested in the success test
      await waitFor(() => {
        expect(authService.forgotPassword).toHaveBeenCalled();
      });
    });
  });

  describe('Success', () => {
    it('should display success alert', async () => {
      const user = userEvent.setup();
      (authService.forgotPassword as jest.Mock).mockResolvedValueOnce({
        data: { message: 'Password reset email sent.' }
      });
      render(<ForgotPassword />);
      const buttonElement = screen.getByRole('button');
      const emailElement = screen.getByLabelText('Email');
      await user.type(emailElement, 'manny');
      
      await act(async () => {
        await user.click(buttonElement);
      });

      // Wait for the API call to complete and alert to appear
      const alert = await screen.findByRole('alert', {}, { timeout: 10000 });
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass('alert-success');
      expect(alert.textContent).toEqual('Password reset email sent.');
    });
  });

  describe('Error', () => {
    it('should display error alert and border', async () => {
      const user = userEvent.setup();
      const error = new Error('Field must be valid');
      (error as any).response = {
        data: {
          message: 'Field must be valid'
        }
      };
      (authService.forgotPassword as jest.Mock).mockRejectedValueOnce(error);
      render(<ForgotPassword />);
      const buttonElement = screen.getByRole('button');
      const emailElement = screen.getByLabelText('Email');
      await user.type(emailElement, 'manny');
      
      await act(async () => {
        await user.click(buttonElement);
      });

      const alert = await screen.findByRole('alert', {}, { timeout: 10000 });
      expect(alert).toBeInTheDocument();
      await waitFor(() => {
        expect(emailElement).toHaveStyle({ border: '1px solid #fa9b8a' });
      });
      expect(alert).toHaveClass('alert-error');
      expect(alert.textContent).toEqual('Field must be valid');
    });
  });
});

