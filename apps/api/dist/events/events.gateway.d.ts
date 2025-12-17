import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinTournament(tournamentId: string, client: Socket): {
        event: string;
        data: string;
    };
    handleLeaveTournament(tournamentId: string, client: Socket): {
        event: string;
        data: string;
    };
}
