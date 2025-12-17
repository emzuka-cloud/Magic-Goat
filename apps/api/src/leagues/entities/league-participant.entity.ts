import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Unique, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { League } from './league.entity';

@Entity('league_participants')
@Unique(['league', 'user'])
@Index(['points', 'omw_percentage']) // Composite index for standings sort
export class LeagueParticipant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => League, { onDelete: 'CASCADE' })
    @Index()
    league: League;

    @ManyToOne(() => User)
    @Index()
    user: User;

    @Column({ default: 0 })
    points: number;

    @Column({ default: 0 })
    matches_played: number;

    @Column({ default: 0 })
    matches_won: number;

    @Column({ default: 0 })
    matches_drawn: number;

    @Column({ default: 0 })
    matches_lost: number;

    @Column({ type: 'float', default: 0 })
    omw_percentage: number;
}
