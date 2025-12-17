import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('join_tournament')
    handleJoinTournament(
        @MessageBody() tournamentId: string,
        @ConnectedSocket() client: Socket,
    ) {
        client.join(`tournament_${tournamentId}`);
        console.log(`Client ${client.id} joined tournament_${tournamentId}`);
        return { event: 'joined_tournament', data: tournamentId };
    }

    @SubscribeMessage('leave_tournament')
    handleLeaveTournament(
        @MessageBody() tournamentId: string,
        @ConnectedSocket() client: Socket,
    ) {
        client.leave(`tournament_${tournamentId}`);
        console.log(`Client ${client.id} left tournament_${tournamentId}`);
        return { event: 'left_tournament', data: tournamentId };
    }
}
