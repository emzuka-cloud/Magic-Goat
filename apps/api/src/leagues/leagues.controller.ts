import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { LeaguesService } from './leagues.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateLeagueDto, UpdateLeagueDto, UpdateStandingDto } from './dto';
import { AddPersonDto, GroupIdDto } from '../tournaments/dto';

@Controller('leagues')
export class LeaguesController {
    constructor(private readonly leaguesService: LeaguesService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    create(@Body() createLeagueDto: CreateLeagueDto, @Request() req: any) {
        return this.leaguesService.create(createLeagueDto, req.user);
    }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    findAll(@Request() req: any) {
        return this.leaguesService.findAll(req.user.id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.leaguesService.assertCanView(id, req.user.id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateLeagueDto: UpdateLeagueDto, @Request() req: any) {
        await this.leaguesService.assertOwner(id, req.user.id);
        return this.leaguesService.update(id, updateLeagueDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete(':id')
    async remove(@Param('id') id: string, @Request() req: any) {
        await this.leaguesService.assertOwner(id, req.user.id);
        return this.leaguesService.remove(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id/standings')
    async getStandings(@Param('id') id: string, @Request() req: any) {
        await this.leaguesService.assertCanView(id, req.user.id);
        return this.leaguesService.getStandings(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch(':id/standings/:userId')
    async updateStanding(@Param('id') id: string, @Param('userId') userId: string, @Body() updates: UpdateStandingDto, @Request() req: any) {
        await this.leaguesService.assertOwner(id, req.user.id);
        return this.leaguesService.updateStanding(id, userId, updates);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/members')
    async addMember(@Param('id') id: string, @Body() body: AddPersonDto, @Request() req: any) {
        await this.leaguesService.assertOwner(id, req.user.id);
        return this.leaguesService.addMember(id, body.userId || body.username || '');
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete(':id/members/:userId')
    async removeMember(@Param('id') id: string, @Param('userId') userId: string, @Request() req: any) {
        await this.leaguesService.assertOwner(id, req.user.id);
        return this.leaguesService.removeMember(id, userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/leave')
    leave(@Param('id') id: string, @Request() req: any) {
        return this.leaguesService.removeMember(id, req.user.id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/groups')
    async addGroup(@Param('id') id: string, @Body() body: GroupIdDto, @Request() req: any) {
        await this.leaguesService.assertOwner(id, req.user.id);
        return this.leaguesService.addPlayGroup(id, body.groupId);
    }
}
