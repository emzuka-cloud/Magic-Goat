import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UserSearchDto } from './dto';

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

    /** Find people to add by username prefix or exact U- ID. Never searches or returns emails. */
    @Get('search')
    @UseGuards(AuthGuard('jwt'))
    search(@Query() query: UserSearchDto, @Request() req: any) {
        return this.usersService.search(query.q, req.user.id);
    }
}
