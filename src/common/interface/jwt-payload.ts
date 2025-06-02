export interface JwtPayload {
  email: string;
  name: string;
  role: string;
  sessionId: string;
  deviceId: string;
  sub: string;
  iat: number;
  exp: number;
}
