import { useState, useCallback, type ReactNode } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import { userService } from '@services/api/user/user.service';
import { Utils } from '@services/utils/utils.service';
import { addUser } from '@redux/reducers/user/userSlice';
import useLocalStorage from '@hooks/useLocalStorage';
import useSessionStorage from '@hooks/useSessionStorage';
import useEffectOnce from '@hooks/useEffectOnce';
import type { RootState, AppDispatch } from '@redux/store';
import type { UserProfile } from '@redux/reducers/user/userSlice';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { profile, token } = useSelector((state: RootState) => state.user);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [tokenIsValid, setTokenIsValid] = useState(false);
  const keepLoggedIn = useLocalStorage<boolean>('keepLoggedIn', 'get') as boolean;
  const pageReload = useSessionStorage<boolean>('pageReload', 'get') as boolean;
  const [deleteStorageUsername] = useLocalStorage<string>('username', 'delete') as [() => void];
  const [setLoggedIn] = useLocalStorage<boolean>('keepLoggedIn', 'set') as [(value: boolean) => void];
  const [deleteSessionPageReload] = useSessionStorage<boolean>('pageReload', 'delete') as [() => void];
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const checkUser = useCallback(async () => {
    try {
      const response = await userService.checkCurrentUser();
      // dispatch conversation list
      setUserData(response.data.user);
      setTokenIsValid(true);
      
      // Generate avatarImage URL from image ID/version fields
      const userProfile = { ...response.data.user };
      let avatarImageUrl = '';
      
      // Only generate from ID/version if they exist, otherwise preserve existing URL
      if (userProfile.profileImageId && userProfile.profileImageVersion) {
        avatarImageUrl = Utils.getImage(userProfile.profileImageId as string, userProfile.profileImageVersion as string);
      } else if (userProfile.avatarImageId && userProfile.avatarImageVersion) {
        avatarImageUrl = Utils.getImage(userProfile.avatarImageId as string, userProfile.avatarImageVersion as string);
      } else {
        // Fallback to existing URL fields if they exist
        avatarImageUrl = (userProfile.profilePicture as string) ||
                        (userProfile.avatarImage as string) ||
                        '';
      }
      
      // Only update if we have a valid URL
      if (avatarImageUrl) {
        userProfile.avatarImage = avatarImageUrl;
        userProfile.profilePicture = avatarImageUrl;
      }
      
      dispatch(addUser({ token: response.data.token, profile: userProfile }));
    } catch {
      setTokenIsValid(false);
      setTimeout(async () => {
        Utils.clearStore({
          dispatch,
          deleteStorageUsername,
          deleteSessionPageReload,
          setLoggedIn
        });
        await userService.logoutUser();
        navigate('/');
      }, 1000);
    }
  }, [dispatch, navigate, deleteStorageUsername, deleteSessionPageReload, setLoggedIn]);

  useEffectOnce(() => {
    checkUser();
  });

  if (keepLoggedIn || (!keepLoggedIn && userData) || (profile && token) || pageReload) {
    if (!tokenIsValid) {
      return <></>;
    }
    return <>{children}</>;
  }

  return <Navigate to="/" />;
};

export default ProtectedRoute;

