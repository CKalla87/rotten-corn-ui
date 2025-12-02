import { describe, it, expect } from 'vitest';
import { resetPasswordMockError } from '@mocks/handlers/auth';
import { server } from '@mocks/server';
import ResetPassword from '@pages/auth/reset-password/ResetPassword';
import { render, screen, waitFor } from '@root/test.utils';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const renderWithSearchParams = (searchParams = '?token=1234567890') => {
  return render(
    <MemoryRouter initialEntries={[`/reset-password${searchParams}`]}>
      <ResetPassword />
    </MemoryRouter>
  );
};

describe('ResetPassword', () => {

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
    renderWithSearchParams();
    const buttonElement = screen.getByRole('button');
    const newPasswordLabel = screen.getByLabelText('New Password');
    const confirmPasswordLabel = screen.getByLabelText('Confirm Password');
    await user.type(newPasswordLabel, 'qwerty1');
    await user.type(confirmPasswordLabel, 'qwerty1');

    await user.click(buttonElement);

    const newButtonElement = screen.getByRole('button');
    expect(newButtonElement.textContent).toEqual('RESET PASSWORD IN PROGRESS...');
    await waitFor(() => {
      const newButtonElement1 = screen.getByRole('button');
      expect(newButtonElement1.textContent).toEqual('RESET PASSWORD');
    });
  });

  describe('Success', () => {
    it('should display success alert', async () => {
      const user = userEvent.setup();
      renderWithSearchParams();
      const buttonElement = screen.getByRole('button');
      const newPasswordLabel = screen.getByLabelText('New Password');
      const confirmPasswordLabel = screen.getByLabelText('Confirm Password');
      await user.type(newPasswordLabel, 'qwerty1');
      await user.type(confirmPasswordLabel, 'qwerty1');
      await user.click(buttonElement);

      const alert = await screen.findByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass('alert-success');
      expect(alert.textContent).toEqual('Password successfully updated.');
    });
  });

  describe('Error', () => {
    it('should display error alert and border', async () => {
      const user = userEvent.setup();
      server.use(resetPasswordMockError);
      renderWithSearchParams();
      const buttonElement = screen.getByRole('button');
      const newPasswordLabel = screen.getByLabelText('New Password');
      const confirmPasswordLabel = screen.getByLabelText('Confirm Password');
      await user.type(newPasswordLabel, 'qwerty1');
      await user.type(confirmPasswordLabel, 'qwerty');
      await user.click(buttonElement);

      const alert = await screen.findByRole('alert');
      expect(alert).toBeInTheDocument();
      await waitFor(() => expect(newPasswordLabel).toHaveStyle({ border: '1px solid #fa9b8a' }));
      await waitFor(() => expect(confirmPasswordLabel).toHaveStyle({ border: '1px solid #fa9b8a' }));
      expect(alert).toHaveClass('alert-error');
      expect(alert.textContent).toEqual('Passwords do not match');
    });
  });
});

