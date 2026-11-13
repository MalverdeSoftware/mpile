"use client";
// Browser helpers: saving files to this computer, and small values kept in this browser's storage.
export function download(
  name: string,
  text: string,
  type = "text/csv;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob([text], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function readKey(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function writeKey(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
export function removeKey(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage unavailable: nothing was kept.
  }
}
