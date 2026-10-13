import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateLeagueDto {
    @IsString() @IsNotEmpty() @MaxLength(100)
    name: string;

    @IsOptional() @IsString() @MaxLength(1000)
    description?: string;

    @IsDateString({}, { message: 'start_date must be a date in YYYY-MM-DD format.' })
    start_date: string;

    @IsOptional() @IsDateString({}, { message: 'end_date must be a date in YYYY-MM-DD format.' })
    end_date?: string;
}

export class UpdateLeagueDto {
    @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100)
    name?: string;

    @IsOptional() @IsString() @MaxLength(1000)
    description?: string;

    @IsOptional() @IsDateString({}, { message: 'start_date must be a date in YYYY-MM-DD format.' })
    start_date?: string;

    @IsOptional() @IsDateString({}, { message: 'end_date must be a date in YYYY-MM-DD format.' })
    end_date?: string;
}

/** Totals the owner wants shown; stored as an adjustment on top of results. OMW% is always calculated. */
export class UpdateStandingDto {
    @IsOptional() @IsInt() @Min(0) points?: number;
    @IsOptional() @IsInt() @Min(0) matches_played?: number;
    @IsOptional() @IsInt() @Min(0) matches_won?: number;
    @IsOptional() @IsInt() @Min(0) matches_drawn?: number;
    @IsOptional() @IsInt() @Min(0) matches_lost?: number;
}
