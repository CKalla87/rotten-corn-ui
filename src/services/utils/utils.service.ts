import { floor, random } from 'lodash';
import type { AxiosResponse } from 'axios';
import { avatarColors } from './static.data';
import type { AppDispatch } from '@redux/store';
import { addUser, clearUser } from '@redux/reducers/user/userSlice';
import { addNotification, clearNotification } from '@redux/reducers/notifications/notificationSlice';
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
    dispatch(clearNotification());
    deleteStorageUsername();
    deleteSessionPageReload();
    setLoggedIn(false);
  }

  static dispatchNotification(message: string, type: string, dispatch: AppDispatch): void {
    dispatch(addNotification({ message, type }));
  }

  static dispatchClearNotification(dispatch: AppDispatch): void {
    dispatch(clearNotification());
  }

  static appEnvironment(): string {
    const env = import.meta.env.VITE_APP_ENVIRONMENT || import.meta.env.MODE;
    if (env === 'development') {
      return 'DEV';
    } else if (env === 'staging') {
      return 'STG';
    }
    return '';
  }

  static mapSettingsDropdownItems(setSettings: (items: Array<{ topText: string; subText: string }>) => void): Array<{ topText: string; subText: string }> {
    const items: Array<{ topText: string; subText: string }> = [];
    const item = {
      topText: 'My Profile',
      subText: 'View personal profile.'
    };
    items.push(item);
    setSettings(items);
    return items;
  }

  static appImageUrl(imgVersion?: string, imgId?: string): string {
    if (!imgId || !imgVersion) {
      return '';
    }
    return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUD_NAME}/image/upload/v${imgVersion}/${imgId}`;
  }

  static generateString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
}

