import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { CreateTournamentDto, PairingResultDto, ExportQueryDto } from './tournaments/dto';
import { CreateLeagueDto, UpdateStandingDto } from './leagues/dto';
import { AddPlayGroupMemberDto } from './playgroups/dto';
import { QueryErrorFilter } from './query-error.filter';

const pipe = new ValidationPipe({ whitelist: true, transform: true });
const check = (metatype: any, value: any, type: 'body' | 'query' = 'body') => pipe.transform(value, { type, metatype });

describe('request validation', () => {
  it('accepts what the client sends and strips unknown fields', async () => {
    const t = await check(CreateTournamentDto, { name: 'Friday', format: 'single_elimination', capacity: 8, created_by: 'x' });
    expect(t).toEqual(Object.assign(new CreateTournamentDto(), { name: 'Friday', format: 'single_elimination', capacity: 8 }));
    await expect(check(CreateLeagueDto, { name: 'L', description: '', start_date: '2026-10-12' })).resolves.toBeDefined();
    await expect(check(PairingResultDto, { result: 'p1_p3' })).resolves.toBeDefined(); // Commander pod
    expect((await check(ExportQueryDto, {}, 'query')).format).toBe('json');
  });

  it.each([
    [CreateTournamentDto, { name: '', format: 'single_elimination' }],
    [CreateTournamentDto, { name: 'x', format: 'swiss-ish' }],
    [CreateTournamentDto, { name: 'x', format: 'commander', capacity: 7 }],
    [CreateLeagueDto, { name: 'x', start_date: 'next tuesday' }],
    [UpdateStandingDto, { points: -1 }],
    [UpdateStandingDto, { points: '5' }],
    [PairingResultDto, { result: 'p1_win; drop table' }],
    [AddPlayGroupMemberDto, { identifier: { $ne: null } }],
    [ExportQueryDto, { format: 'xml' }],
  ])('rejects bad input %#', async (metatype, value) => {
    await expect(check(metatype, value)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('turns a malformed uuid from Postgres into 400', () => {
    const filter = new QueryErrorFilter();
    const sent: any[] = [];
    (filter as any).applicationRef = { reply: (_: any, body: any, status: number) => sent.push([status, body]), isHeadersSent: () => false, end: () => {} };
    const err = new QueryFailedError('SELECT', [], Object.assign(new Error('bad uuid'), { code: '22P02' }));
    filter.catch(err, { getArgByIndex: () => ({}), getArgs: () => [], switchToHttp: () => ({}) } as any);
    expect(sent[0][0]).toBe(400);
    expect(sent[0][1].message).toBe('Invalid ID.');
  });
});
