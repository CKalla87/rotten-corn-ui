import { updatePostItem } from '@redux/reducers/post/postSlice';
import type { AppDispatch } from '@redux/store';
import type { EmptyPostData } from '@services/utils/static.data';

export class ImageUtils {
  static validateFile(file: File | null | undefined, type: string): boolean {
    if (!file) return false;
    
    if (type === 'image') {
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      return validImageTypes.indexOf(file.type) > -1;
    } else {
      const validVideoTypes = ['video/m4v', 'video/avi', 'video/mpg', 'video/mp4', 'video/webm', 'video/quicktime', 'video/x-quicktime'];
      const validVideoExtensions = ['.mov', '.m4v', '.avi', '.mpg', '.mp4', '.webm'];
      
      // Check MIME type first
      if (validVideoTypes.indexOf(file.type) > -1) {
        return true;
      }
      
      // Fallback: check file extension (useful for .mov files that might have different MIME types)
      const fileName = file.name.toLowerCase();
      return validVideoExtensions.some(ext => fileName.endsWith(ext));
    }
  }

  static checkFileSize(file: File | null | undefined, type: string = 'image'): string {
    let fileError = '';
    const isValid = ImageUtils.validateFile(file, type);
    if (!isValid) {
      fileError = `File ${file?.name || ''} not accepted`;
    }
    if (file && file.size > 50000000) {
      // 50 MB
      fileError = 'File is too large.';
    }
    return fileError;
  }

  static checkFile(file: File | null | undefined, type: string = 'image'): void {
    if (!ImageUtils.validateFile(file, type)) {
      window.alert(`File ${file?.name || ''} not accepted`);
      return;
    }
    const fileError = ImageUtils.checkFileSize(file, type);
    if (fileError) {
      window.alert(fileError);
    }
  }

  static addFileToRedux(
    event: React.ChangeEvent<HTMLInputElement>,
    post: EmptyPostData,
    setSelectedFile: (file: File | null) => void,
    dispatch: AppDispatch,
    type: string = 'image'
  ): void {
    const file = event.target.files?.[0];
    if (!file) return;

    ImageUtils.checkFile(file, type);
    setSelectedFile(file);
    dispatch(
      updatePostItem({
        image: type === 'image' ? URL.createObjectURL(file) : '',
        video: type === 'video' ? URL.createObjectURL(file) : '',
        gifUrl: '',
        imgId: '',
        imgVersion: '',
        post: post.post || ''
      })
    );
  }

  static readAsBase64(file: File): Promise<string> {
    const reader = new FileReader();
    const fileValue = new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (event) => {
        reject(event);
      };
    });
    reader.readAsDataURL(file);
    return fileValue;
  }

  static getBackgroundColor(imageUrl: string): Promise<string> {
    const image = new Image();
    image.crossOrigin = 'Anonymous';
    const backgroundImageColor = new Promise<string>((resolve, reject) => {
      image.addEventListener('load', () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);
        const hexColor = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        resolve(hexColor);
      });
      image.addEventListener('error', (event) => {
        reject(event);
      });
    });
    image.src = imageUrl;
    return backgroundImageColor;
  }

  static getBackgroundImageColor(imageUrl: string): Promise<string> {
    const image = new Image();
    image.crossOrigin = 'Anonymous';
    const backgroundImageColor = new Promise<string>((resolve, reject) => {
      image.addEventListener('load', () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const params = imageData.data;
        const bgColor = ImageUtils.convertRGBToHex(params[0], params[1], params[2]);
        resolve(bgColor);
      });
      image.addEventListener('error', (event) => {
        reject(event);
      });
    });
    image.src = imageUrl;
    return backgroundImageColor;
  }

  static convertRGBToHex(red: number, green: number, blue: number): string {
    let redHex = red.toString(16);
    let greenHex = green.toString(16);
    let blueHex = blue.toString(16);
    redHex = redHex.length === 1 ? '0' + redHex : redHex;
    greenHex = greenHex.length === 1 ? '0' + greenHex : greenHex;
    blueHex = blueHex.length === 1 ? '0' + blueHex : blueHex;
    return `#${redHex}${greenHex}${blueHex}`;
  }
}

