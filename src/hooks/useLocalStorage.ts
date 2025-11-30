type UseLocalStorageType = 'get' | 'set' | 'delete';

type UseLocalStorageReturn<T> = 
  | T 
  | [setValue: (newValue: T) => void]
  | [deleteValue: () => void];

const useLocalStorage = <T>(key: string, type: UseLocalStorageType): UseLocalStorageReturn<T> => {
  try {
    if (type === 'get') {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : ('' as T);
    } else if (type === 'set') {
      const setValue = (newValue: T) => {
        window.localStorage.setItem(key, JSON.stringify(newValue));
      };
      return [setValue];
    } else {
      const deleteValue = () => {
        window.localStorage.removeItem(key);
      };
      return [deleteValue];
    }
  } catch (error) {
    console.log(error);
    return '' as T;
  }
};

export default useLocalStorage;

