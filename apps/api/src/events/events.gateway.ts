import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import { corsOrigin } from '../cors';
import { verifyIdToken } from '../auth/cognito';
import { UsersService } from '../users/users.service';
import { Tournament } from '../tournaments/entities/tournament.entity';

@WebSocketGateway({ cors: { origin: corsOrigin } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private usersService: UsersService,
        @InjectRepository(Tournament) private tournamentsRepository: Repository<Tournament>,
    ) { }

    /** Requires a Cognito ID token in `auth.token`; joins the caller's own `user_<id>` room for invitations. */
    async handleConnection(client: Socket) {
        try {
            const payload = await verifyIdToken(client.handshake.auth?.token);
            const user = await this.usersService.findOrCreateUser(payload);
            client.data.userId = user.id;
            client.join(`user_${user.id}`);
        } catch {
            client.disconnect(true);
        }
    }

    handleDisconnect(client: Socket) { }

    @SubscribeMessage('join_tournament')
    async handleJoinTournament(
        @MessageBody() tournamentId: string,
        @ConnectedSocket() client: Socket,
    ) {
        const userId = client.data.userId;
        // Same rule as GET /tournaments/:id: owner, participant, or member of its league.
        const canView = !!userId && typeof tournamentId === 'string' && await this.tournamentsRepository.exists({
            where: [
                { id: tournamentId, created_by: { id: userId } },
                { id: tournamentId, participants: { user: { id: userId } } },
                { id: tournamentId, league: { created_by: { id: userId } } },
                { id: tournamentId, league: { participants: { user: { id: userId } } } },
            ],
        }).catch(() => false); // malformed UUID
        if (!canView) return { event: 'error', data: 'You are not part of this tournament.' };
        client.join(`tournament_${tournamentId}`);
        return { event: 'joined_tournament', data: tournamentId };
    }

    @SubscribeMessage('leave_tournament')
    handleLeaveTournament(
        @MessageBody() tournamentId: string,
        @ConnectedSocket() client: Socket,
    ) {
        client.leave(`tournament_${tournamentId}`);
        return { event: 'left_tournament', data: tournamentId };
    }
}
