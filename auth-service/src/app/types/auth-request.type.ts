import { JwtPayload } from './jwt-payload.type';

export type AuthRequest = {
  user?: JwtPayload;
};
