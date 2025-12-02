import { http, HttpResponse } from 'msw';
import { existingUser, userJwt } from '@mocks/data/user.mock';

const BASE_URL = '/api/v1';

export const signInMock = http.post(`${BASE_URL}/signin`, () => {
  const result = {
    message: 'User login successfully',
    user: existingUser,
    token: userJwt
  };
  return HttpResponse.json(result);
});

export const signUpMock = http.post(`${BASE_URL}/signup`, () => {
  const result = {
    message: 'User created successfully',
    user: existingUser,
    token: userJwt
  };
  return HttpResponse.json(result);
});

export const forgotPasswordMock = http.post(`${BASE_URL}/forgot-password`, () => {
  const result = {
    message: 'Password reset email sent.'
  };
  return HttpResponse.json(result);
});

export const resetPasswordMock = http.post(`${BASE_URL}/reset-password/1234567890`, () => {
  const result = {
    message: 'Password successfully updated.'
  };
  return HttpResponse.json(result);
});

export const signInMockError = http.post(`${BASE_URL}/signin`, () => {
  const result = {
    message: 'Invalid credentials'
  };
  return HttpResponse.json(result, { status: 400 });
});

export const signUpMockError = http.post(`${BASE_URL}/signup`, () => {
  const result = {
    message: 'Invalid credentials'
  };
  return HttpResponse.json(result, { status: 400 });
});

export const forgotPasswordMockError = http.post(`${BASE_URL}/forgot-password`, () => {
  const result = {
    message: 'Field must be valid'
  };
  return HttpResponse.json(result, { status: 400 });
});

export const resetPasswordMockError = http.post(`${BASE_URL}/reset-password/1234567890`, () => {
  const result = {
    message: 'Passwords do not match'
  };
  return HttpResponse.json(result, { status: 400 });
});

export const authHandlers = [
  signInMock,
  signUpMock,
  signInMockError,
  signUpMockError,
  forgotPasswordMock,
  forgotPasswordMockError,
  resetPasswordMock,
  resetPasswordMockError
];

