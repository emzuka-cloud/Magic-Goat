import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { LeaguesService } from './leagues.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('leagues')
export class LeaguesController {
    constructor(private readonly leaguesService: LeaguesService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    create(@Body() createLeagueDto: { name: string; description?: string; start_date: Date; end_date?: Date }, @Request() req: any) {
        return this.leaguesService.create(createLeagueDto, req.user);
    }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    findAll(@Request() req: any) {
        return this.leaguesService.findAll(req.user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.leaguesService.findOne(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateLeagueDto: any) {
        return this.leaguesService.update(id, updateLeagueDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.leaguesService.remove(id);
    }

    @Get(':id/standings')
    getStandings(@Param('id') id: string) {
        return this.leaguesService.getStandings(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch(':id/standings/:userId')
    updateStanding(@Param('id') id: string, @Param('userId') userId: string, @Body() updates: any) {
        return this.leaguesService.updateStanding(id, userId, updates);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/members')
    addMember(@Param('id') id: string, @Body() body: { userId?: string; username?: string }) {
        return this.leaguesService.addMember(id, body.userId || body.username || '');
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete(':id/members/:userId')
    removeMember(@Param('id') id: string, @Param('userId') userId: string) {
        return this.leaguesService.removeMember(id, userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/leave')
    leave(@Param('id') id: string, @Request() req: any) {
        return this.leaguesService.removeMember(id, req.user.id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/groups')
    addGroup(@Param('id') id: string, @Body() body: { groupId: string }) {
        return this.leaguesService.addPlayGroup(id, body.groupId);
    }
}
