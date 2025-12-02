import { createSearchParams } from 'react-router-dom';

interface NavigateToProfileData {
  username?: string;
  _id?: string;
  uId?: string;
}

export class ProfileUtils {
  static navigateToProfile(data: NavigateToProfileData, navigate: (path: string) => void): void {
    const url = `/app/social/profile/${data?.username}?${createSearchParams({ id: data?._id || '', uId: data?.uId || '' })}`;
    navigate(url);
  }
}

