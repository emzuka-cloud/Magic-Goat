import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

// Cognito is the identity provider; this module only verifies its JWTs.
@Module({
    imports: [UsersModule, PassportModule],
    providers: [JwtStrategy],
})
export class AuthModule { }
