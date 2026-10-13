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

    // Manual corrections by the league owner, added on top of what tournament results give.
    // The columns above always hold results + adjustment, so sorting stays in SQL.
    @Column({ default: 0 })
    adj_points: number;

    @Column({ default: 0 })
    adj_matches_played: number;

    @Column({ default: 0 })
    adj_matches_won: number;

    @Column({ default: 0 })
    adj_matches_drawn: number;

    @Column({ default: 0 })
    adj_matches_lost: number;
}

/** Stats an owner can correct by hand. OMW% is always calculated. */
export const ADJUSTABLE_STATS = ['points', 'matches_played', 'matches_won', 'matches_drawn', 'matches_lost'] as const;
export type AdjustableStat = typeof ADJUSTABLE_STATS[number];
