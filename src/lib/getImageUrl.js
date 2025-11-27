export function getImageUrl(filename) {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    return `/uploads/${filename}`;
  }

  return `/api/uploads/${filename}`;
}
