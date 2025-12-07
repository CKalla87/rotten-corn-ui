import axios from '@services/axios';

class ImageService {
  async getUserImages(userId: string) {
    const response = await axios.get(`/images/${userId}`);
    return response;
  }

  async addImage(url: string, data: string) {
    const response = await axios.post(url, { image: data });
    return response;
  }

  async removeImage(url: string) {
    const response = await axios.delete(url);
    return response;
  }
}

export const imageService = new ImageService();


