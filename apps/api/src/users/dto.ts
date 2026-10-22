import { IsString, MaxLength, MinLength } from 'class-validator';

export class UserSearchDto {
    @IsString() @MinLength(2) @MaxLength(50)
    q: string;
}
