type UseSessionStorageType = 'get' | 'set' | 'delete';

type UseSessionStorageReturn<T> = 
  | T 
  | [setValue: (newValue: T) => void]
  | [deleteValue: () => void];

const useSessionStorage = <T>(key: string, type: UseSessionStorageType): UseSessionStorageReturn<T> => {
  try {
    if (type === 'get') {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : ('' as T);
    } else if (type === 'set') {
      const setValue = (newValue: T) => {
        window.sessionStorage.setItem(key, JSON.stringify(newValue));
      };
      return [setValue];
    } else {
      const deleteValue = () => {
        window.sessionStorage.removeItem(key);
      };
      return [deleteValue];
    }
  } catch (error) {
    console.log(error);
    return '' as T;
  }
};

export default useSessionStorage;

