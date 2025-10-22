export interface LibraryItem {
  id: string;
  type: 'image' | 'video';
  dataUrl: string;
  prompt: string;
  createdAt: string;
  originalImage?: string;
}

const LIBRARY_KEY = 'visionaryStudioLibrary';

export const getLibrary = (): LibraryItem[] => {
  try {
    const storedLibrary = localStorage.getItem(LIBRARY_KEY);
    return storedLibrary ? JSON.parse(storedLibrary) : [];
  } catch (error) {
    console.error("Failed to parse library from localStorage", error);
    localStorage.removeItem(LIBRARY_KEY);
    return [];
  }
};

export const saveLibrary = (library: LibraryItem[]): void => {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
  } catch (error) {
    console.error("Failed to save library to localStorage", error);
    alert("Could not save to library. Your browser's storage may be full.");
  }
};
