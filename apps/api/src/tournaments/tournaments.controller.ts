import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, Query, Res, Delete } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { AuthGuard } from '@nestjs/passport';
import { AddPersonDto, CreatePairingDto, CreateTournamentDto, ExportQueryDto, GroupIdDto, InvitationDto, PairingResultDto, SetLeagueDto, StartTimerDto } from './dto';

@Controller('tournaments')
export class TournamentsController {
    constructor(private readonly tournamentsService: TournamentsService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    create(@Body() createTournamentDto: CreateTournamentDto, @Request() req: any) {
        return this.tournamentsService.create(createTournamentDto, req.user);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id/league')
    async setLeague(@Param('id') id: string, @Body() body: SetLeagueDto, @Request() req: any) {
        await this.tournamentsService.assertOwner(id, req.user.id);
        return this.tournamentsService.setLeague(id, body.leagueId, req.user.id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/groups')
    async addGroup(@Param('id') id: string, @Body() body: GroupIdDto, @Request() req: any) {
        await this.tournamentsService.assertOwner(id, req.user.id);
        return this.tournamentsService.addGroup(id, body.groupId);
    }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    findAll(@Request() req: any) {
        return this.tournamentsService.findAll(req.user.id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req: any) {
        await this.tournamentsService.assertOwner(id, req.user.id);
        return this.tournamentsService.deleteTournament(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/participants')
    async addParticipant(@Param('id') id: string, @Body() body: AddPersonDto, @Request() req: any) {
        await this.tournamentsService.assertOwner(id, req.user.id);
        return this.tournamentsService.addParticipant(id, body.userId || body.username || '');
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete(':id/participants/:userId')
    async removeParticipant(@Param('id') id: string, @Param('userId') userId: string, @Request() req: any) {
        await this.tournamentsService.assertOwner(id, req.user.id);
        return this.tournamentsService.removeParticipant(id, userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/leave')
    leave(@Param('id') id: string, @Request() req: any) {
        return this.tournamentsService.removeParticipant(id, req.user.id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.tournamentsService.assertCanView(id, req.user.id);
    }

    // Anyone signed in can ask; only the owner can let them in.
    @UseGuards(AuthGuard('jwt'))
    @Post(':id/join')
    join(@Param('id') id: string, @Request() req: any) {
        return this.tournamentsService.requestToJoin(id, req.user);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id/join-requests')
    async joinRequests(@Param('id') id: string, @Request() req: any) {
        await this.tournamentsService.assertOwner(id, req.user.id);
        return this.tournamentsService.pendingJoinRequests(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/join-requests/:requestId/approve')
    async approveJoinRequest(@Param('id') id: string, @Param('requestId') requestId: string, @Request() req: any) {
        await this.tournamentsService.assertOwner(id, req.user.id);
        return this.tournamentsService.answerJoinRequest(id, requestId, true);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/join-requests/:requestId/decline')
    async declineJoinRequest(@Param('id') id: string, @Param('requestId') requestId: string, @Request() req: any) {
        await this.tournamentsService.assertOwner(id, req.user.id);
        return this.tournamentsService.answerJoinRequest(id, requestId, false);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/pairings')
    async createPairing(
        @Param('id') id: string,
        @Body() body: CreatePairingDto,
        @Request() req: any,
    ) {
        await this.tournamentsService.assertOwner(id, req.user.id);
        return this.tournamentsService.createPairing(id, body.round, body.player1Id, body.player2Id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id/pairings')
    async getPairings(@Param('id') id: string, @Request() req: any) {
        await this.tournamentsService.assertCanView(id, req.user.id);
        return this.tournamentsService.getPairings(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/pairings/generate')
    async generatePairings(@Param('id') id: string, @Request() req: any) {
        await this.tournamentsService.assertOwner(id, req.user.id);
        return this.tournamentsService.generatePairings(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id/pairings/:pairingId')
    async updatePairingResult(
        @Param('id') id: string,
        @Param('pairingId') pairingId: string,
        @Body() body: PairingResultDto,
        @Request() req: any,
    ) {
        await this.tournamentsService.assertOwner(id, req.user.id);
        return this.tournamentsService.updatePairingResult(id, pairingId, body.result);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/timer/start')
    async startTimer(
        @Param('id') id: string,
        @Body() body: StartTimerDto,
        @Request() req: any,
    ) {
        await this.tournamentsService.assertOwner(id, req.user.id);
        return this.tournamentsService.startTimer(id, body.durationMinutes);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/timer/pause')
    async pauseTimer(@Param('id') id: string, @Request() req: any) {
        await this.tournamentsService.assertOwner(id, req.user.id);
        return this.tournamentsService.pauseTimer(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/timer/reset')
    async resetTimer(@Param('id') id: string, @Request() req: any) {
        await this.tournamentsService.assertOwner(id, req.user.id);
        return this.tournamentsService.resetTimer(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id/export')
    async exportTournament(
        @Param('id') id: string,
        @Query() query: ExportQueryDto,
        @Res() res: any,
        @Request() req: any,
    ) {
        await this.tournamentsService.assertOwner(id, req.user.id);
        const { data, contentType, filename } = await this.tournamentsService.exportTournament(id, query.format);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(data);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/invitations')
    async createInvitation(
        @Param('id') id: string,
        @Body() body: InvitationDto,
        @Request() req: any,
    ) {
        await this.tournamentsService.assertOwner(id, req.user.id);
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
