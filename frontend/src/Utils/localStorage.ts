export function setStorageItem(key: string, value: string) {
  localStorage.setItem(key, value.toString());
}

export function removeStorageItem(key: string) {
  localStorage.removeItem(key);
}

export function getStorageItem(key: string): string | null {
  return localStorage.getItem(key);
}

export function clearStorage() {
  localStorage.clear();
}
