import { IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';
import { TournamentFormat } from './entities/tournament.entity';

export class CreateTournamentDto {
    @IsString() @IsNotEmpty() @MaxLength(100)
    name: string;

    @IsEnum(TournamentFormat)
    format: TournamentFormat;

    // Bracket math needs a power of two (generatePairings uses log2(capacity)).
    @IsOptional() @IsIn([4, 8, 16, 32, 64])
    capacity?: number;

    /** Count this tournament's results in one of your leagues. */
    @IsOptional() @IsUUID()
    leagueId?: string;
}

export class SetLeagueDto {
    /** A league you own, or null to take the tournament out of its league. */
    @IsOptional() @IsUUID()
    leagueId?: string | null;
}

export class GroupIdDto {
    @IsUUID()
    groupId: string;
}

/** Add a person by user ID, username or email (tournaments and leagues). */
export class AddPersonDto {
    @IsOptional() @IsString() @MaxLength(255)
    userId?: string;

    @IsOptional() @IsString() @MaxLength(255)
    username?: string;
}

export class CreatePairingDto {
    @IsInt() @Min(1)
    round: number;

    @IsUUID()
    player1Id: string;

    @IsUUID()
    player2Id: string;
}

export class PairingResultDto {
    // p1_win / p2_win for brackets; Commander pods send the two winners, e.g. "p1_p3".
    @Matches(/^(p[12]_win|draw|p[1-4]_p[1-4])$/, { message: 'Unknown match result.' })
    result: string;
}

export class StartTimerDto {
    @IsOptional() @IsInt() @Min(1) @Max(600)
    durationMinutes?: number;
}

export class InvitationDto {
    @IsUUID()
    inviteeId: string;
}

export class ExportQueryDto {
    @IsOptional() @IsIn(['json', 'csv'])
    format: 'json' | 'csv' = 'json';
}
