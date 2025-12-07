import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';
import Input from '@components/input/Input';
import Button from '@components/button/Button';
import { userService } from '@services/api/user/user.service';
import { Utils } from '@services/utils/utils.service';
import useLocalStorage from '@hooks/useLocalStorage';
import useSessionStorage from '@hooks/useSessionStorage';
import type { AppDispatch } from '@redux/store';
import '@components/change-password/ChangePassword.scss';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [togglePassword, setTogglePassword] = useState(false);
  const [type, setType] = useState('password');
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [, deleteStorageUsername] = useLocalStorage<unknown>('username', 'delete') as [() => void];
  const [, deleteSessionPageReload] = useSessionStorage<unknown>('pageReload', 'delete') as [() => void];
  const [, setLoggedIn] = useLocalStorage<boolean>('keepLoggedIn', 'set') as [(value: boolean) => void];

  const togglePasswordDisplay = () => {
    setTogglePassword(!togglePassword);
    const inputType = type === 'password' ? 'text' : 'password';
    setType(inputType);
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await userService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (response) {
        Utils.dispatchNotification(response.data.message, 'success', dispatch);
        setTimeout(async () => {
          Utils.clearStore({
            dispatch,
            deleteStorageUsername,
            deleteSessionPageReload,
            setLoggedIn
          });
          await userService.logoutUser();
          navigate('/');
        }, 3000);
      }
    } catch (error: any) {
      Utils.dispatchNotification(error?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  return (
    <div className="password-change-container" data-testid="change-password">
      <form onSubmit={changePassword}>
        <div className="form-group">
          <Input
            id="currentPassword"
            name="currentPassword"
            type={type}
            value={currentPassword}
            labelText="Current Password"
            placeholder=""
            handleChange={(event) => setCurrentPassword(event.target.value)}
          />
        </div>
        <div className="form-group">
          <Input
            id="newPassword"
            name="newPassword"
            type={type}
            value={newPassword}
            labelText="New Password"
            placeholder=""
            handleChange={(event) => setNewPassword(event.target.value)}
          />
        </div>
        <div className="form-group">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={type}
            value={confirmPassword}
            labelText="Confirm Password"
            placeholder=""
            handleChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>
        <div className="form-group form-btn-group">
          <div className="btn-group">
            <Button
              label="Update"
              className="update"
              disabled={!currentPassword || !newPassword || !confirmPassword}
              handleClick={changePassword}
            />
            <span className="eye-icon" data-testid="eye-icon" onClick={togglePasswordDisplay}>
              {!togglePassword ? <FaRegEyeSlash /> : <FaRegEye />}
            </span>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
