import { Socket } from 'socket.io';

import { JwtPayload } from 'src/modules/auth/services/token.service';

export interface AuthenticatedSocket extends Socket {
  data: {
    user: JwtPayload;
  };
}
