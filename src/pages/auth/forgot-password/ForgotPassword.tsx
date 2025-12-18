import { useState } from 'react';
import './ForgotPassword.sass';
import { FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Input from '@components/input/Input';
import Button from '@components/button/Button';
import { authService } from '@services/api/auth/auth.service';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  const forgotPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    event.preventDefault();
    try {
      const result = await authService.forgotPassword(email);
      setAlertType('alert-success');
      setResponseMessage(result.data.message);
      setShowAlert(true);
      setLoading(false);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setAlertType('alert-error');
      setLoading(false);
      setShowAlert(true);
      setResponseMessage(axiosError?.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="container-wrapper">
      <div className="container-wrapper-auth">
        <div 
          className="tabs forgot-password-tabs"
          style={{ height: `${responseMessage ? '300px' : ''}` }}
        >
          <div className="tabs-auth">
            <ul className="tab-group">
              <li className="tab">
                <div className="login forgot-password">Forgot Password</div>
              </li>
            </ul>
            <div className="tab-item">
              <div className="auth-inner">
                {responseMessage && (
                  <div className={`alerts ${alertType}`} role="alert">
                    {responseMessage}
                  </div>
                )}
                <form className="forgot-password-form" onSubmit={forgotPassword}>
                  <div className="form-input-container">
                    <Input
                      id="email"
                      name="email"
                      type="text"
                      value={email}
                      labelText="Email"
                      placeholder="Enter Email"
                      style={{ border: `${showAlert ? '1px solid #fa9b8a' : ''}` }}
                      handleChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                  <Button 
                    label={loading ? 'FORGOT PASSWORD IN PROGRESS...' : 'FORGOT PASSWORD'}
                    className="auth-button button" 
                    disabled={!email}
                  />
                  <Link to={'/'}>
                    <span className="login">
                      <FaArrowLeft className="arrow-left" /> Back to Login
                    </span>
                  </Link>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

