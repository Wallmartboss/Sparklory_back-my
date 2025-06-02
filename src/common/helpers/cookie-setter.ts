import { Response } from 'express';

export const cookieSetter = (
  response: Response,
  refreshToken?: string,
  deviceId?: string,
) => {
  const setup = {
    httpOnly: true,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    sameSite: 'none' as 'none' | 'lax' | 'strict',
    secure: true,
  };

  if (refreshToken) {
    response.cookie('refresh_token', refreshToken, { ...setup });
  }

  if (deviceId) {
    response.cookie('device_id', deviceId, {
      ...setup,
    });
  }
};
