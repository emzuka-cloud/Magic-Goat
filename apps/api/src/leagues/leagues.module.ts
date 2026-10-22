import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaguesService } from './leagues.service';
import { LeaguesController } from './leagues.controller';
import { League } from './entities/league.entity';
import { LeagueParticipant } from './entities/league-participant.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Pairing } from '../tournaments/entities/pairing.entity';
import { JoinRequestsModule } from '../join-requests/join-requests.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [TypeOrmModule.forFeature([League, LeagueParticipant, Tournament, Pairing]), NotificationsModule, JoinRequestsModule],
    controllers: [LeaguesController],
    providers: [LeaguesService],
})
export class LeaguesModule { }
