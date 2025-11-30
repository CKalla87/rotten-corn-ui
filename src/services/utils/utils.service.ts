import { floor, random } from 'lodash';
import type { AxiosResponse } from 'axios';
import { avatarColors } from './static.data';
import type { AppDispatch } from '@redux/store';
import { addUser, clearUser } from '@redux/reducers/user/userSlice';
import type { UserProfile } from '@redux/reducers/user/userSlice';

export class Utils {
  static avatarColor(): string {
    return avatarColors[floor(random() * avatarColors.length)];
  }

  static generateAvatar(text: string, backgroundColor: string, foregroundColor: string = 'white'): string {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      return '';
    }

    canvas.width = 200;
    canvas.height = 200;

    // Draw background
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text
    context.font = 'normal 80px sans-serif';
    context.fillStyle = foregroundColor;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL('image/png');
  }

  static dispatchUser(
    result: AxiosResponse<{ token: string; user: UserProfile }>,
    pageReload: (reload: boolean) => void,
    dispatch: AppDispatch,
    setUser: (user: UserProfile) => void
  ): void {
    pageReload(true);
    dispatch(addUser({ token: result.data.token, profile: result.data.user }));
    setUser(result.data.user);
  }

  static clearStore({
    dispatch,
    deleteStorageUsername,
    deleteSessionPageReload,
    setLoggedIn
  }: {
    dispatch: AppDispatch;
    deleteStorageUsername: () => void;
    deleteSessionPageReload: () => void;
    setLoggedIn: (value: boolean) => void;
  }): void {
    dispatch(clearUser());
    // dispatch clear notification action
    deleteStorageUsername();
    deleteSessionPageReload();
    setLoggedIn(false);
  }
}

