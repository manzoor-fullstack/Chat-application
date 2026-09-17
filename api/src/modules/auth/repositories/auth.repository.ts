/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/database/prisma.service";

@Injectable()
export class AuthRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findUserByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findUserByUsername(username: string) {
        return this.prisma.user.findUnique({
            where: { username },
        });
    }

    async findUserById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async createUser(data: {
        email: string;
        username: string;
        passwordHash: string;
    }) {
        return this.prisma.user.create({
            data,
        });
    }

    async createRefreshToken(data: {
        userId: string;
        tokenHash: string;
        expiresAt: Date;
    }) {
        return this.prisma.refreshToken.create({
            data,
        });
    }

    async findRefreshTokensByUserId(userId: string) {
        return this.prisma.refreshToken.findMany({
            where: {
                userId,
                revokedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });
    }

    async revokeRefreshToken(id: string) {
        return this.prisma.refreshToken.update({
            where: { id },
            data: {
                revokedAt: new Date(),
            },
        });
    }

    async revokeAllRefreshTokensByUserId(userId: string) {
        return this.prisma.refreshToken.updateMany({
            where: {
                userId,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        });
    }
}