import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    async getMe(@Request() req: any) {
        // The JWT guard already validated the token and called findOrCreateUser
        // So the user should now exist in the database
        // Just return the user from the request (set by JWT strategy)
        return req.user;
    }
}
