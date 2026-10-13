import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePlayGroupDto {
    @IsString() @IsNotEmpty() @MaxLength(100)
    name: string;

    @IsOptional() @IsString() @MaxLength(1000)
    description?: string;
}

export class AddPlayGroupMemberDto {
    /** User ID, username or email. */
    @IsString() @IsNotEmpty() @MaxLength(255)
    identifier: string;
}
