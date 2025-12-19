import axios from '@services/axios';

class PostService {
  async getAllPosts(page: number) {
    const response = await axios.get(`/post/all/${page}`);
    return response;
  }

  async createPost(body: unknown) {
    const response = await axios.post('/post', body);
    return response;
  }

  async createPostWithImage(body: unknown) {
    const response = await axios.post('/post/image/post', body);
    return response;
  }

  async getReactionsByUsername(username: string) {
    const response = await axios.get(`/post/single/reactions/username/${username}`);
    return response;
  }

  async getSinglePostReactionByUsername(postId: string, username: string) {
    // Use a longer timeout for reaction checks (they can take time in develop env)
    const response = await axios.get(`/post/single/reaction/username/${username}/${postId}`, {
      timeout: 120000 // 2 minutes - same as regular requests
    });
    return response;
  }

  async getPostReactions(postId: string) {
    const response = await axios.get(`/post/reactions/${postId}`);
    return response;
  }

  async addReaction(body: unknown) {
    const response = await axios.post('/post/reaction', body);
    return response;
  }

  async removeReaction(postId: string, previousReaction: string, postReactions: unknown, commentId?: string) {
    // If commentId is provided, include it in the request body for comment reactions
    if (commentId) {
      const response = await axios.delete(`/post/reaction/${postId}/${previousReaction}/${JSON.stringify(postReactions)}`, {
        data: { commentId }
      });
      return response;
    }
    const response = await axios.delete(`/post/reaction/${postId}/${previousReaction}/${JSON.stringify(postReactions)}`);
    return response;
  }

  async addComment(body: unknown) {
    // Use longer timeout for comment creation (can take time in develop env)
    const response = await axios.post('/post/comment', body, {
      timeout: 120000 // 2 minutes
    });
    return response;
  }

  async getPostCommentsNames(postId: string) {
    // Use longer timeout for comment names (can take time in develop env)
    const response = await axios.get(`/post/commentsnames/${postId}`, {
      timeout: 120000 // 2 minutes
    });
    return response;
  }

  async getPostComments(postId: string) {
    // Use longer timeout for getting comments (can take time in develop env)
    const response = await axios.get(`/post/comments/${postId}`, {
      timeout: 120000 // 2 minutes
    });
    return response;
  }

  async updatePost(postId: string, body: unknown) {
    if (!postId || postId.trim() === '') {
      throw new Error('Post ID is required for updating a post');
    }
    const response = await axios.put(`/post/${postId}`, body);
    return response;
  }

  async updatePostWithImage(postId: string, body: unknown) {
    if (!postId || postId.trim() === '') {
      throw new Error('Post ID is required for updating a post with image');
    }
    const response = await axios.put(`/post/image/${postId}`, body);
    return response;
  }

  async updatePostWithVideo(postId: string, body: unknown) {
    if (!postId || postId.trim() === '') {
      throw new Error('Post ID is required for updating a post with video');
    }
    const response = await axios.put(`/post/video/${postId}`, body);
    return response;
  }

  async createPostWithVideo(body: unknown) {
    const response = await axios.post('/post/video/post', body);
    return response;
  }

  async deletePost(postId: string) {
    const response = await axios.delete(`/post/${postId}`);
    return response;
  }

  async getPostsWithImages(page: number) {
    const response = await axios.get(`/post/images/${page}`);
    return response;
  }

  async getPostsWithVideos(page: number) {
    const response = await axios.get(`/post/videos/${page}`);
    return response;
  }
}

export const postService = new PostService();

