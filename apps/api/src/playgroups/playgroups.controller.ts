import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PlayGroupsService } from './playgroups.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('playgroups')
@UseGuards(AuthGuard('jwt'))
export class PlayGroupsController {
    constructor(private readonly playGroupsService: PlayGroupsService) { }

    @Post()
    create(@Body() createDto: { name: string; description?: string; ownerId?: string; ownerUsername?: string; ownerEmail?: string }) {
        return this.playGroupsService.create(createDto);
    }

    @Get('user/:userId')
    findAll(@Param('userId') userId: string) {
        return this.playGroupsService.findAllForUser(userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.playGroupsService.findOne(id);
    }

    @Post(':id/members')
    addMember(@Param('id') id: string, @Body() body: { identifier: string }) {
        return this.playGroupsService.addMember(id, body.identifier);
    }

    @Delete(':id/members/:memberId')
    removeMember(@Param('id') id: string, @Param('memberId') memberId: string) {
        return this.playGroupsService.removeMember(id, memberId);
    }

    @Post(':id/leave')
    leave(@Param('id') id: string, @Request() req: any) {
        console.log('🔍 [leave endpoint] groupId:', id, 'userId:', req.user.id);
        return this.playGroupsService.removeMember(id, req.user.id);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.playGroupsService.remove(id);
    }
}
