/* eslint-disable prettier/prettier */
import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from './services/token.service';
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { AuthResponseDto } from './dto/auth-response.dto';
import { CurrentUserResponseDto } from './dto/current-user-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }

    // Register user endpoint
    @ApiOperation({
        summary: 'Register a new user',
    })
    @ApiCreatedResponse({
        description: 'User registered successfully',
        type: AuthResponseDto,
    })
    @ApiResponse({
        status: 409,
        description: 'Email or username already exists',
    })
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async resgister(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }


    // Login user endpoint
    @ApiOperation({
        summary: 'Login user',
    })
    @ApiOkResponse({
        description: 'Login successful',
        type: AuthResponseDto,
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid email or password',
    })
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }


    // RefreshToken user endpoint
    @ApiOperation({
  summary: 'Refresh access and refresh tokens',
})
@ApiOkResponse({
  description: 'Tokens refreshed successfully',
  type: AuthResponseDto,
})
@ApiResponse({
  status: 401,
  description: 'Refresh token is invalid, expired, or revoked',
})
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refresh(dto);
    }


    // Logout user endpoint
    @ApiOperation({
        summary:
            'Logout user and revoke refresh token',
    })
    @ApiResponse({
        status: 204,
        description:
            'Logged out successfully',
    })
    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    async logout(@Body() dto: LogoutDto): Promise<void> {
        await this.authService.logout(dto);
    }


    // Get current user endpoint
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary:
            'Get currently authenticated user',
    })
    @ApiResponse({
        status: 200,
        description:
            'Current user returned successfully',
    })
    @ApiResponse({
        status: 401,
        description:
            'Access token is missing, invalid, or expired',
    })
    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getMe(@CurrentUser() user: JwtPayload,): Promise<CurrentUserResponseDto> {
        return this.authService.getMe(user.sub);
    }
}
