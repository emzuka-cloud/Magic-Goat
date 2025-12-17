import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, Query, Res, Delete } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { AuthGuard } from '@nestjs/passport';
import { TournamentFormat } from './entities/tournament.entity';

@Controller('tournaments')
export class TournamentsController {
    constructor(private readonly tournamentsService: TournamentsService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    create(@Body() createTournamentDto: { name: string; format: TournamentFormat; capacity?: number }, @Request() req: any) {
        return this.tournamentsService.create(createTournamentDto, req.user);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/groups')
    addGroup(@Param('id') id: string, @Body() body: { groupId: string }) {
        return this.tournamentsService.addGroup(id, body.groupId);
    }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    findAll(@Request() req: any) {
        return this.tournamentsService.findAll(req.user.id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.tournamentsService.deleteTournament(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/participants')
    addParticipant(@Param('id') id: string, @Body() body: { userId?: string; username?: string }) {
        return this.tournamentsService.addParticipant(id, body.userId || body.username || '');
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete(':id/participants/:userId')
    removeParticipant(@Param('id') id: string, @Param('userId') userId: string) {
        return this.tournamentsService.removeParticipant(id, userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/leave')
    leave(@Param('id') id: string, @Request() req: any) {
        return this.tournamentsService.removeParticipant(id, req.user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.tournamentsService.findOne(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/join')
    join(@Param('id') id: string, @Request() req: any) {
        return this.tournamentsService.joinTournament(id, req.user);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/pairings')
    createPairing(
        @Param('id') id: string,
        @Body() body: { round: number; player1Id: string; player2Id: string },
    ) {
        return this.tournamentsService.createPairing(id, body.round, body.player1Id, body.player2Id);
    }

    @Get(':id/pairings')
    getPairings(@Param('id') id: string) {
        return this.tournamentsService.getPairings(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/pairings/generate')
    generatePairings(@Param('id') id: string) {
        return this.tournamentsService.generatePairings(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id/pairings/:pairingId')
    updatePairingResult(
        @Param('pairingId') pairingId: string,
        @Body() body: { result: string },
    ) {
        return this.tournamentsService.updatePairingResult(pairingId, body.result);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/timer/start')
    startTimer(
        @Param('id') id: string,
        @Body() body: { durationMinutes?: number },
    ) {
        return this.tournamentsService.startTimer(id, body.durationMinutes);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/timer/pause')
    pauseTimer(@Param('id') id: string) {
        return this.tournamentsService.pauseTimer(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/timer/reset')
    resetTimer(@Param('id') id: string) {
        return this.tournamentsService.resetTimer(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id/export')
    async exportTournament(
        @Param('id') id: string,
        @Query('format') format: 'json' | 'csv' = 'json',
        @Res() res: any,
    ) {
        const { data, contentType, filename } = await this.tournamentsService.exportTournament(id, format);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(data);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/invitations')
    createInvitation(
        @Param('id') id: string,
        @Body() body: { inviteeId: string },
    ) {
        return this.tournamentsService.createInvitation(id, body.inviteeId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('invitations/my')
    getUserInvitations(@Request() req: any) {
        return this.tournamentsService.getUserInvitations(req.user.id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('invitations/:id/accept')
    acceptInvitation(
        @Param('id') id: string,
        @Request() req: any,
    ) {
        return this.tournamentsService.acceptInvitation(id, req.user);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('invitations/:id/decline')
    declineInvitation(
        @Param('id') id: string,
        @Request() req: any,
    ) {
        return this.tournamentsService.declineInvitation(id, req.user);
    }
}
