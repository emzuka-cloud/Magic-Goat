import { ArgumentsHost, BadRequestException, Catch } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';

/**
 * A malformed ID (e.g. GET /tournaments/abc) reaches Postgres as an invalid uuid and used to be a 500.
 * Covers every route param and body ID at once instead of a ParseUUIDPipe on each.
 */
@Catch(QueryFailedError)
export class QueryErrorFilter extends BaseExceptionFilter {
    catch(exception: QueryFailedError, host: ArgumentsHost) {
        const code = (exception as any).driverError?.code;
        if (code === '22P02') return super.catch(new BadRequestException('Invalid ID.'), host); // invalid_text_representation
        return super.catch(exception, host);
    }
}
