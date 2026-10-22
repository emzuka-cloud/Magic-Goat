import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { passportJwtSecret } from 'jwks-rsa';
import { UsersService } from '../users/users.service';
import { COGNITO_CLIENT_ID, COGNITO_ISSUER, COGNITO_JWKS_URI } from './cognito';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private usersService: UsersService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: COGNITO_JWKS_URI,
            }),
            issuer: COGNITO_ISSUER,
            // Cognito ID tokens carry the app client ID as `aud`; tokens for other clients of the pool are rejected.
            audience: COGNITO_CLIENT_ID,
            algorithms: ['RS256'],
        });
    }

    async validate(payload: any) {
        // Only ID tokens: access tokens have no `aud` and no email claims.
        if (payload.token_use !== 'id') throw new UnauthorizedException('Use a Cognito ID token.');
        // Find or create user in local DB to ensure FK constraints work
        return this.usersService.findOrCreateUser(payload);
    }
}
