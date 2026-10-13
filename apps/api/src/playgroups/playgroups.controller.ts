import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PlayGroupsService } from './playgroups.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('playgroups')
@UseGuards(AuthGuard('jwt'))
export class PlayGroupsController {
    constructor(private readonly playGroupsService: PlayGroupsService) { }

    @Post()
    create(@Body() createDto: { name: string; description?: string }, @Request() req: any) {
        // Owner is always the caller; any owner fields in the body are ignored.
        return this.playGroupsService.create(createDto, req.user);
    }

    // ponytail: :userId kept for client compatibility, but you can only list your own groups.
    @Get('user/:userId')
    findAll(@Request() req: any) {
        return this.playGroupsService.findAllForUser(req.user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.playGroupsService.assertCanView(id, req.user.id);
    }

    @Post(':id/members')
    async addMember(@Param('id') id: string, @Body() body: { identifier: string }, @Request() req: any) {
        await this.playGroupsService.assertOwner(id, req.user.id);
        return this.playGroupsService.addMember(id, body.identifier);
    }

    @Delete(':id/members/:memberId')
    async removeMember(@Param('id') id: string, @Param('memberId') memberId: string, @Request() req: any) {
        await this.playGroupsService.assertOwner(id, req.user.id);
        return this.playGroupsService.removeMember(id, memberId);
    }

    @Post(':id/leave')
    leave(@Param('id') id: string, @Request() req: any) {
        return this.playGroupsService.removeMember(id, req.user.id);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Request() req: any) {
        await this.playGroupsService.assertOwner(id, req.user.id);
        return this.playGroupsService.remove(id);
    }
}
