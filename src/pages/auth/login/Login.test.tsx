import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@root/test.utils';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import Login from '@pages/auth/login/Login';
import { server } from '@mocks/server';
import { signInMockError } from '@mocks/handlers/auth';

const mockedUseNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedUseNavigate
  };
});

describe('SigIn', () => {
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
      const buttonElement = screen.getByRole('button');
      expect(buttonElement).toBeDisabled();
    });

    it('should be enabled with inputs', () => {
      render(<Login />);
      const buttonElement = screen.getByRole('button');
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
      const buttonElement = screen.getByRole('button');
      const usernameElement = screen.getByLabelText('Username');
      const passwordElement = screen.getByLabelText('Password');
      await user.type(usernameElement, 'manny');
      await user.type(passwordElement, 'qwerty');
      await user.click(buttonElement);

      await waitFor(() => {
        const newButtonElement = screen.getByRole('button');
        expect(newButtonElement.textContent).toEqual('SIGNIN IN PROGRESS...');
      });
    });
  });

  describe('Success', () => {
    it('should navigate to streams page', async () => {
      const user = userEvent.setup();
      render(<Login />);
      const buttonElement = screen.getByRole('button');
      const usernameElement = screen.getByLabelText('Username');
      const passwordElement = screen.getByLabelText('Password');

      await user.type(usernameElement, 'manny');
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
      server.use(signInMockError);

      render(<Login />);
      const buttonElement = screen.getByRole('button');
      const usernameElement = screen.getByLabelText('Username');
      const passwordElement = screen.getByLabelText('Password');

      await user.type(usernameElement, 'manny');
      await user.type(passwordElement, 'qwerty');

      await user.click(buttonElement);

      const alert = await screen.findByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toEqual('Invalid credentials');

      await waitFor(() => {
        expect(usernameElement).toHaveStyle({ border: '1px solid #fa9b8a' });
      });
      await waitFor(() => {
        expect(passwordElement).toHaveStyle({ border: '1px solid #fa9b8a' });
      });
    });
  });
});

