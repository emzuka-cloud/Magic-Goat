import { Controller, Request, Post, UseGuards, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Request() req: any) {
        return this.authService.login(req.user);
    }

    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @Post('register')
    async register(@Body() user: Partial<User>) {
        return this.authService.register(user);
    }
}
