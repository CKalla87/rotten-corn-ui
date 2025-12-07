import { cloneDeep, find, findIndex, remove } from 'lodash';
import { closeModal } from '@redux/reducers/modal/modalSlice';
import { clearPost, updatePostItem } from '@redux/reducers/post/postSlice';
import { postService } from '@services/api/post/post.service';
import { ImageUtils } from '@services/utils/image-utils.service';
import { Utils } from '@services/utils/utils.service';
import { socketService } from '@services/socket/socket.service';
import type { AppDispatch } from '@redux/store';

interface PostData {
  post: string;
  bgColor: string;
  privacy: string;
  feelings: string;
  gifUrl: string;
  profilePicture: string;
  image: string;
  video: string;
}

export class PostUtils {
  static selectBackground(
    bgColor: string,
    postData: PostData,
    setTextAreaBackground: (color: string) => void,
    setPostData: (data: PostData | ((prev: PostData) => PostData)) => void,
    setDisable: (disabled: boolean) => void
  ): void {
    postData.bgColor = bgColor;
    setTextAreaBackground(bgColor);
    setPostData({ ...postData });
    setDisable(false);
  }

  static postInputEditable(
    textContent: string,
    postData: PostData,
    setPostData: (data: PostData | ((prev: PostData) => PostData)) => void,
    setDisable: (disabled: boolean) => void
  ): void {
    postData.post = textContent;
    setPostData({ ...postData });
    setDisable(false);
  }

  static closePostModal(dispatch: AppDispatch): void {
    dispatch(closeModal());
    dispatch(clearPost());
  }

  static clearImage(
    postData: PostData,
    post: string,
    inputRef: React.RefObject<HTMLDivElement>,
    dispatch: AppDispatch,
    setSelectedPostImage: (file: File | null) => void,
    setPostImage: (image: string) => void,
    setDisable: (disabled: boolean) => void,
    setPostData: (data: PostData | ((prev: PostData) => PostData)) => void
  ): void {
    postData.gifUrl = '';
    postData.image = '';
    postData.video = '';
    setSelectedPostImage(null);
    setPostImage('');
    setTimeout(() => {
      if (inputRef?.current) {
        inputRef.current.textContent = !post ? postData?.post : post;
        if (post) {
          postData.post = post;
        }
        setPostData(postData);
      }
      PostUtils.positionCursor('editable');
    });
    dispatch(
      updatePostItem({
        gifUrl: '',
        image: '',
        imgId: '',
        imgVersion: '',
        video: '',
        videoId: '',
        videoVersion: ''
      })
    );
  }

  static postInputData(
    imageInputRef: React.RefObject<HTMLDivElement>,
    postData: PostData,
    post: string,
    setPostData: (data: PostData | ((prev: PostData) => PostData)) => void
  ): void {
    setTimeout(() => {
      if (imageInputRef?.current) {
        imageInputRef.current.textContent = !post ? postData?.post : post;
      }
      if (post) {
        postData.post = post;
      }
      setPostData(postData);
    }, 50);
  }

  static dispatchNotification(
    message: string,
    type: string,
    setApiResponse: (response: string) => void,
    setLoading: (loading: boolean) => void,
    setDisable: (disabled: boolean) => void,
    dispatch: AppDispatch
  ): void {
    setApiResponse(type);
    setLoading(false);
    setDisable(false);
    Utils.dispatchNotification(message, type, dispatch);
  }

  static async sendPostWithImageRequest(
    fileResult: string,
    postData: PostData,
    imageInputRef: React.RefObject<HTMLDivElement>,
    setApiResponse: (response: string) => void,
    setLoading: (loading: boolean) => void,
    setDisable: (disabled: boolean) => void,
    dispatch: AppDispatch
  ): Promise<any> {
    try {
      postData.image = fileResult;
      if (imageInputRef?.current) {
        imageInputRef.current.textContent = postData.post;
      }
      const response = await postService.createPostWithImage(postData);
      if (response) {
        setApiResponse('success');
        setLoading(false);
        return response;
      }
      return null;
    } catch (error: any) {
      PostUtils.dispatchNotification(
        error.response?.data?.message || 'An error occurred',
        'error',
        setApiResponse,
        setLoading,
        setDisable,
        dispatch
      );
      return null;
    }
  }

  static async sendPostWithFileRequest(
    type: string,
    postData: PostData,
    imageInputRef: React.RefObject<HTMLDivElement>,
    setApiResponse: (response: string) => void,
    setLoading: (loading: boolean) => void,
    setDisable: (disabled: boolean) => void,
    dispatch: AppDispatch
  ): Promise<any> {
    try {
      if (imageInputRef?.current) {
        imageInputRef.current.textContent = postData.post;
      }
      const response =
        type === 'image'
          ? await postService.createPostWithImage(postData)
          : await postService.createPostWithVideo(postData);
      if (response) {
        setApiResponse('success');
        setLoading(false);
        return response;
      }
      return null;
    } catch (error: any) {
      PostUtils.dispatchNotification(
        error.response?.data?.message || 'An error occurred',
        'error',
        setApiResponse,
        setLoading,
        setDisable,
        dispatch
      );
      return null;
    }
  }

  static checkPrivacy(
    post: { privacy?: string; userId?: string; [key: string]: unknown },
    profile: { _id?: string; [key: string]: unknown },
    following: unknown[]
  ): boolean {
    const isPrivate = post?.privacy === 'Private' && post?.userId === profile?._id;
    const isPublic = post?.privacy === 'Public';
    const isFollower =
      post?.privacy === 'Followers' && Utils.checkIfUserIsFollowed(following, post?.userId, profile?._id);
    return isPrivate || isPublic || isFollower;
  }

  static positionCursor(elementId: string): void {
    const element = document.getElementById(elementId);
    if (!element) return;
    const selection = window.getSelection();
    const range = document.createRange();
    selection?.removeAllRanges();
    range.selectNodeContents(element);
    range.collapse(false);
    selection?.addRange(range);
    element.focus();
  }

  static insertTextAtCursor(element: HTMLElement | null, text: string): void {
    if (!element) return;
    
    element.focus();
    const selection = window.getSelection();
    
    if (!selection) {
      // Fallback: append to the end
      element.textContent = (element.textContent || '') + text;
      PostUtils.positionCursor(element.id);
      return;
    }
    
    let range: Range;
    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    } else {
      // If no selection, create range at the end
      range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      selection.addRange(range);
    }
    
    // Delete any selected content
    range.deleteContents();
    
    // Insert the text
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    
    // Move cursor after inserted text
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    element.focus();
  }

  static socketIOPost(
    _posts: unknown[],
    setPosts: (posts: unknown[] | ((prev: unknown[]) => unknown[])) => void
  ): void {
    // Remove existing listeners to avoid duplicates
    socketService?.socket?.off('add post');
    socketService?.socket?.off('update post');
    socketService?.socket?.off('delete post');
    socketService?.socket?.off('update like');
    socketService?.socket?.off('update comment');
    
    socketService?.socket?.on('add post', (post: unknown) => {
      setPosts((prevPosts: unknown[]) => [post, ...prevPosts]);
    });

    socketService?.socket?.on('update post', (post: any) => {
      setPosts((prevPosts: unknown[]) => {
        const postsCopy = cloneDeep(prevPosts);
        return PostUtils.updateSinglePostInArray(postsCopy, post);
      });
    });

    socketService?.socket?.on('delete post', (postId: string) => {
      setPosts((prevPosts: unknown[]) => {
        const postsCopy = cloneDeep(prevPosts) as any[];
        const filtered = postsCopy.filter((postData: any) => postData._id !== postId);
        return filtered;
      });
    });

    socketService?.socket?.on('update like', (reactionData: any) => {
      setPosts((prevPosts: unknown[]) => {
        const postsCopy = cloneDeep(prevPosts) as any[];
        const postData = find(postsCopy, (post: any) => post._id === reactionData?.postId);
        if (postData) {
          postData.reactions = reactionData.postReactions;
          return PostUtils.updateSinglePostInArray(postsCopy, postData);
        }
        return postsCopy;
      });
    });

    socketService?.socket?.on('update comment', (reactionData: any) => {
      setPosts((prevPosts: unknown[]) => {
        const postsCopy = cloneDeep(prevPosts) as any[];
        const postData = find(postsCopy, (post: any) => post._id === reactionData?.postId);
        if (postData) {
          postData.reactions = reactionData.postReactions;
          return PostUtils.updateSinglePostInArray(postsCopy, postData);
        }
        return postsCopy;
      });
    });
  }

  static updateSinglePostInArray(
    posts: unknown[],
    post: any
  ): unknown[] {
    const postsCopy = cloneDeep(posts);
    const index = findIndex(postsCopy as any[], ['_id', post?._id]);
    if (index > -1) {
      (postsCopy as any[]).splice(index, 1, post);
    }
    return postsCopy;
  }

  static updateSinglePost(
    posts: unknown[],
    post: any,
    setPosts: (posts: unknown[]) => void
  ): void {
    let postsCopy = cloneDeep(posts);
    const index = findIndex(postsCopy as any[], ['_id', post?._id]);
    if (index > -1) {
      (postsCopy as any[]).splice(index, 1, post);
      setPosts(postsCopy);
    }
  }

  static async sendUpdatePostRequest(
    postId: string,
    postData: PostData,
    setApiResponse: (response: string) => void,
    setLoading: (loading: boolean) => void,
    setDisable: (disabled: boolean) => void,
    dispatch: AppDispatch
  ): Promise<any> {
    try {
      const response = await postService.updatePost(postId, postData);
      if (response) {
        PostUtils.dispatchNotification(
          response.data.message,
          'success',
          setApiResponse,
          setLoading,
          setDisable,
          dispatch
        );
        setTimeout(() => {
          setApiResponse('success');
          setLoading(false);
        }, 3000);
        PostUtils.closePostModal(dispatch);
      }
      return response;
    } catch (error: any) {
      PostUtils.dispatchNotification(
        error.response?.data?.message || 'An error occurred',
        'error',
        setApiResponse,
        setLoading,
        setDisable,
        dispatch
      );
      return null;
    }
  }

  static async sendUpdatePostWithImageRequest(
    fileResult: string,
    postId: string,
    postData: PostData,
    setApiResponse: (response: string) => void,
    setLoading: (loading: boolean) => void,
    setDisable: (disabled: boolean) => void,
    dispatch: AppDispatch
  ): Promise<any> {
    try {
      postData.image = fileResult;
      postData.gifUrl = '';
      (postData as unknown as Record<string, unknown>).imgId = '';
      (postData as unknown as Record<string, unknown>).imgVersion = '';
      const response = await postService.updatePostWithImage(postId, postData);
      if (response) {
        PostUtils.dispatchNotification(
          response.data.message,
          'success',
          setApiResponse,
          setLoading,
          setDisable,
          dispatch
        );
        setTimeout(() => {
          setApiResponse('success');
          setLoading(false);
        }, 3000);
      }
      return response;
    } catch (error: any) {
      PostUtils.dispatchNotification(
        error.response?.data?.message || 'An error occurred',
        'error',
        setApiResponse,
        setLoading,
        setDisable,
        dispatch
      );
      return null;
    }
  }

  static async sendUpdatePostWithFileRequest(
    type: string,
    postId: string,
    postData: PostData,
    setApiResponse: (response: string) => void,
    setLoading: (loading: boolean) => void,
    dispatch: AppDispatch
  ): Promise<any> {
    try {
      const response =
        type === 'image'
          ? await postService.updatePostWithImage(postId, postData)
          : await postService.updatePostWithVideo(postId, postData);
      if (response) {
        PostUtils.dispatchNotification(
          response.data.message,
          'success',
          setApiResponse,
          setLoading,
          () => {},
          dispatch
        );
        setTimeout(() => {
          setApiResponse('success');
          setLoading(false);
        }, 3000);
        PostUtils.closePostModal(dispatch);
      }
      return response;
    } catch (error: any) {
      PostUtils.dispatchNotification(
        error.response?.data?.message || 'An error occurred',
        'error',
        setApiResponse,
        setLoading,
        () => {},
        dispatch
      );
      return null;
    }
  }
}

