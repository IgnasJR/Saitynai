export function setStorageItem(key: string, value: string | number) {
  localStorage.setItem(key, value.toString());
}

export function removeStorageItem(key: string) {
  localStorage.removeItem(key);
}
