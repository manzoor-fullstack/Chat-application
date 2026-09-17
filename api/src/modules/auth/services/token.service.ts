/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { StringValue } from 'ms';

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(
    payload: JwtPayload,
  ): Promise<string> {
    const expiresIn = this.configService.getOrThrow<StringValue>(
        'JWT_ACCESS_EXPIRES',
      );

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>(
        'JWT_ACCESS_SECRET',
      ),
      expiresIn,
    });
  }

  async generateRefreshToken(
    payload: JwtPayload,
  ): Promise<string> {
    const expiresIn = this.configService.getOrThrow<StringValue>(
        'JWT_REFRESH_EXPIRES',
      );

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>(
        'JWT_REFRESH_SECRET',
      ),
      expiresIn,
    });
  }

  async verifyAccessToken(
    token: string,
  ): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(
      token,
      {
        secret: this.configService.getOrThrow<string>(
          'JWT_ACCESS_SECRET',
        ),
      },
    );
  }

  async verifyRefreshToken(
    token: string,
  ): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(
      token,
      {
        secret: this.configService.getOrThrow<string>(
          'JWT_REFRESH_SECRET',
        ),
      },
    );
  }

  async getTokenExpiration(
    token: string,
  ): Promise<Date> {
    const decoded = await this.jwtService.decode(token);

    if (
      !decoded ||
      typeof decoded === 'string' ||
      !decoded.exp
    ) {
      throw new Error(
        'Unable to determine token expiration',
      );
    }

    return new Date(decoded.exp * 1000);
  }
}