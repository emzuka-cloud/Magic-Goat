import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

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

export class UpdateStandingDto {
    @IsOptional() @IsInt() @Min(0) points?: number;
    @IsOptional() @IsInt() @Min(0) matches_played?: number;
    @IsOptional() @IsInt() @Min(0) matches_won?: number;
    @IsOptional() @IsInt() @Min(0) matches_drawn?: number;
    @IsOptional() @IsInt() @Min(0) matches_lost?: number;
    @IsOptional() @IsNumber() @Min(0) @Max(1) omw_percentage?: number;
}
