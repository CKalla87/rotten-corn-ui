import { floor, random, findIndex, some } from 'lodash';
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
    // Generate avatarImage URL from image ID/version fields
    const userProfile = { ...result.data.user };
    let avatarImageUrl = '';
    
    // Only generate from ID/version if they exist, otherwise preserve existing URL
    if (userProfile.profileImageId && userProfile.profileImageVersion) {
      avatarImageUrl = this.getImage(userProfile.profileImageId as string, userProfile.profileImageVersion as string);
    } else if (userProfile.avatarImageId && userProfile.avatarImageVersion) {
      avatarImageUrl = this.getImage(userProfile.avatarImageId as string, userProfile.avatarImageVersion as string);
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
    
    dispatch(addUser({ token: result.data.token, profile: userProfile }));
    setUser(userProfile);
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
    const env = import.meta.env.VITE_APP_ENVIRONMENT || import.meta.env.MODE || 'local';
    if (env === 'development') {
      return 'DEV';
    } else if (env === 'staging') {
      return 'STG';
    } else if (env === 'local') {
      return 'LOCAL';
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
    // Strip quotes if present (fixes issues with stringified values)
    const version = typeof imgVersion === 'string' ? imgVersion.replace(/['"]+/g, '') : imgVersion;
    const id = typeof imgId === 'string' ? imgId.replace(/['"]+/g, '') : imgId;
    const cloudName = import.meta.env.VITE_CLOUD_NAME;
    if (!cloudName) {
      return '';
    }
    // Use the standard Cloudinary URL format
    // Note: If you get 401 errors, the backend needs to upload images with access_mode: 'public'
    return `https://res.cloudinary.com/${cloudName}/image/upload/v${version}/${id}`;
  }

  static getImage(imageId?: string, imageVersion?: string): string {
    return imageId && imageVersion ? this.appImageUrl(imageVersion, imageId) : '';
  }

  static fixCloudinaryUrl(url: string | undefined | null): string {
    if (!url) return '';
    let fixedUrl = url.toString();
    
    // Fix common Cloudinary URL malformations
    // Fix typo: cloudingary -> cloudinary
    fixedUrl = fixedUrl.replace(/cloudingary/g, 'cloudinary');
    
    // Fix missing dot: res/cloudinary.com -> res.cloudinary.com
    fixedUrl = fixedUrl.replace(/https:\/\/res\//g, 'https://res.');
    fixedUrl = fixedUrl.replace(/http:\/\/res\//g, 'http://res.');
    
    // Ensure proper format: res.cloudinary.com
    fixedUrl = fixedUrl.replace(/res\/cloudinary\.com/g, 'res.cloudinary.com');
    
    return fixedUrl;
  }

  static getVideo(videoId?: string, videoVersion?: string): string {
    return videoId && videoVersion
      ? `https://res.cloudinary.com/${import.meta.env.VITE_CLOUD_NAME}/video/upload/v${videoVersion}/${videoId}`
      : '';
  }

  static generateString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  static checkIfUserIsBlocked(blocked: string[], userId: string): boolean {
    return blocked.some((id) => id === userId);
  }

  static checkIfUserIsFollowed(
    userFollowers: Array<{ _id?: string; [key: string]: unknown }>,
    postCreatorId?: string,
    userId?: string
  ): boolean {
    return userFollowers.some((user) => user._id === postCreatorId || postCreatorId === userId);
  }

  static checkIfUserIsOnline(username: string, onlineUsers: string[]): boolean {
    return some(onlineUsers, (user) => user === username?.toLowerCase());
  }

  static firstLetterUpperCase(word: string): string {
    if (!word) return '';
    return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
  }

  static formattedReactions(reactions: Record<string, number>): Array<{ type: string; value: number }> {
    const postReactions: Array<{ type: string; value: number }> = [];
    for (const [key, value] of Object.entries(reactions)) {
      if (value > 0) {
        const reactionObject = {
          type: key,
          value
        };
        postReactions.push(reactionObject);
      }
    }
    return postReactions;
  }

  static shortenLargeNumbers(data: number | undefined): string | number {
    if (data === undefined) {
      return 0;
    }
    // Simple implementation - can be enhanced with millify library if needed
    if (data >= 1000000) {
      return `${(data / 1000000).toFixed(1)}M`;
    } else if (data >= 1000) {
      return `${(data / 1000).toFixed(1)}K`;
    }
    return data;
  }

  static removeUserFromList(list: string[], userId: string): string[] {
    const index = findIndex(list, (id) => id === userId);
    if (index > -1) {
      const updatedList = [...list];
      updatedList.splice(index, 1);
      return updatedList;
    }
    return list;
  }

  static checkUrl(pathname: string, url: string): boolean {
    return pathname.includes(url);
  }

  static renameFile(element: File): File {
    const fileName = element.name.split('.').slice(0, -1).join('.');
    const blob = element.slice(0, element.size, 'image/png');
    const newFile = new File([blob], `${fileName}.png`, { type: 'image/png' });
    return newFile;
  }
}

