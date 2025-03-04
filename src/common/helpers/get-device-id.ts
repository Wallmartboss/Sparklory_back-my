export const getDeviceIdFromCookies = (
  cookieString: string = '',
): string | null => {
  const cookies = Object.fromEntries(
    cookieString.split('; ').map(cookie => cookie.split('=')),
  );
  return cookies['device_id'] || null;
};
