/* eslint-disable prettier/prettier */
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';

import { PasswordService } from 'src/common/password/password.service';

import { AuthRepository } from './repositories/auth.repository';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

import { JwtPayload, TokenService } from './services/token.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { CurrentUserResponseDto } from './dto/current-user-response.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly authRepository: AuthRepository,
        private readonly passwordService: PasswordService,
        private readonly tokenService: TokenService,
    ) { }

    // Register user method
    async register(dto: RegisterDto): Promise<AuthResponseDto> {
        const email = dto.email.toLowerCase();

        const existingUserByEmail = await this.authRepository.findUserByEmail(email);

        if (existingUserByEmail) {
            throw new ConflictException(
                'Email is already registered',
            );
        }

        const existingUserByUsername = await this.authRepository.findUserByUsername(
            dto.username,
        );

        if (existingUserByUsername) {
            throw new ConflictException(
                'Username is already taken',
            );
        }

        const passwordHash = await this.passwordService.hash(dto.password);

        const user = await this.authRepository.createUser({
            email,
            username: dto.username,
            passwordHash,
        });

        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            username: user.username,
        };

        return this.generateAuthResponse(
            user,
            payload,
        );
    }

    // Login method
    async login(dto: LoginDto): Promise<AuthResponseDto> {
        const user = await this.authRepository.findUserByEmail(
            dto.email.toLowerCase(),
        );

        if (!user) {
            throw new UnauthorizedException(
                'Invalid email or password',
            );
        }

        const isPasswordValid = await this.passwordService.compare(
            dto.password,
            user.passwordHash,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException(
                'Invalid email or password',
            );
        }

        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            username: user.username,
        };

        return this.generateAuthResponse(
            user,
            payload,
        );
    }

    // RefreshToken rotation
    async refresh(dto: RefreshTokenDto): Promise<AuthResponseDto> {
        const { refreshToken } = dto;

        let payload: JwtPayload;

        try {
            payload = await this.tokenService.verifyRefreshToken(
                refreshToken,
            );
        } catch {
            throw new UnauthorizedException(
                'Invalid or expired refresh token',
            );
        }

        const user = await this.authRepository.findUserById(
            payload.sub,
        );

        if (!user) {
            throw new UnauthorizedException(
                'User not found',
            );
        }

        const refreshTokens = await this.authRepository.findRefreshTokensByUserId(
            user.id,
        );

        let matchedToken:
            | (typeof refreshTokens)[number]
            | null = null;

        for (const storedToken of refreshTokens) {
            const isMatch =
                await this.passwordService.compare(
                    refreshToken,
                    storedToken.tokenHash,
                );

            if (isMatch) {
                matchedToken = storedToken;
                break;
            }
        }

        if (!matchedToken) {
            throw new UnauthorizedException(
                'Refresh token is invalid or revoked',
            );
        }

        await this.authRepository.revokeRefreshToken(
            matchedToken.id,
        );

        const newPayload = this.createJwtPayload(user);

        return this.generateAuthResponse(
            user,
            newPayload,
        );
    }

    // Logout method
    async logout(dto: LogoutDto): Promise<void> {
        const { refreshToken } = dto;

        let payload: JwtPayload;

        try {
            payload = await this.tokenService.verifyRefreshToken(
                refreshToken,
            );
        } catch {
            // We intentionally don't reveal
            // whether the token is invalid.
            return;
        }

        const refreshTokens = await this.authRepository.findRefreshTokensByUserId(
            payload.sub,
        );

        for (const storedToken of refreshTokens) {
            const isMatch =
                await this.passwordService.compare(
                    refreshToken,
                    storedToken.tokenHash,
                );

            if (isMatch) {
                await this.authRepository.revokeRefreshToken(
                    storedToken.id,
                );

                break;
            }
        }
    }

    // Get current user
    async getMe(userId: string): Promise<CurrentUserResponseDto> {
        const user = await this.authRepository.findUserById(userId);

        if (!user) {
            throw new UnauthorizedException(
                'User not found',
            );
        }

        return {
            id: user.id,
            email: user.email,
            username: user.username,
            avatarUrl: user.avatarUrl,
        };
    }

    private createJwtPayload(user: {
        id: string;
        email: string;
        username: string;
    }): JwtPayload {
        return {
            sub: user.id,
            email: user.email,
            username: user.username,
        };
    }

    private async generateAuthResponse(
        user: {
            id: string;
            email: string;
            username: string;
            avatarUrl: string | null;
        },
        payload: JwtPayload,
    ): Promise<AuthResponseDto> {

        const accessToken = await this.tokenService.generateAccessToken(
            payload,
        );

        const refreshToken = await this.tokenService.generateRefreshToken(
            payload,
        );

        const tokenHash = await this.passwordService.hash(
            refreshToken,
        );

        const expiresAt = await this.tokenService.getTokenExpiration(
            refreshToken,
        );

        await this.authRepository.createRefreshToken({
            userId: user.id,
            tokenHash,
            expiresAt,
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                avatarUrl: user.avatarUrl,
            },
            accessToken,
            refreshToken,
        };
    }
}