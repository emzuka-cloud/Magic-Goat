import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import { Tournament } from './entities/tournament.entity';
import { TournamentParticipant } from './entities/participant.entity';
import { Pairing } from './entities/pairing.entity';
import { Invitation } from './entities/invitation.entity';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlayGroup } from '../playgroups/playgroups.entity';
import { User } from '../users/entities/user.entity';
import { League } from '../leagues/entities/league.entity';
import { LeagueParticipant } from '../leagues/entities/league-participant.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Tournament, TournamentParticipant, Pairing, Invitation, PlayGroup, User, League, LeagueParticipant]), EventsModule, NotificationsModule],
    controllers: [TournamentsController],
    providers: [TournamentsService],
})
export class TournamentsModule { }
