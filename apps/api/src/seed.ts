/**
 * Local test data. Run: `npm run seed` (same POSTGRES_* env as the API).
 *
 * Creates 8 test players (they can't sign in; add them to tournaments, leagues and groups by username).
 * With SEED_OWNER=<your username> (an account that has signed in at least once) it also creates a play
 * group and a league owned by you with those players, so they show up in your "add player" dropdowns.
 */
import { join } from 'path';
import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';
import { League } from './leagues/entities/league.entity';
import { LeagueParticipant } from './leagues/entities/league-participant.entity';
import { PlayGroup } from './playgroups/playgroups.entity';

const PLAYERS = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8'];

async function seed() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        username: process.env.POSTGRES_USER || 'mtg_user',
        password: process.env.POSTGRES_PASSWORD || 'mtg_password',
        database: process.env.POSTGRES_DB || 'mtg_db',
        // Every entity, like the app's autoLoadEntities, so a new entity can't break the seed again.
        entities: [join(__dirname, '**', '*.entity.{ts,js}')],
        synchronize: true,
    });
    await dataSource.initialize();

    const users = dataSource.getRepository(User);
    const players: User[] = [];
    for (const [i, username] of PLAYERS.entries()) {
        let user = await users.findOneBy({ username });
        if (!user) {
            user = await users.save(users.create({ username, email: `${username}@example.com`, custom_id: `U-SEED0${i + 1}` }));
            console.log(`Created ${username} (${user.custom_id})`);
        }
        players.push(user);
    }

    const ownerName = process.env.SEED_OWNER;
    if (!ownerName) {
        console.log('Tip: set SEED_OWNER=<your username> to also get a play group and a league with these players.');
    } else {
        const owner = await users.findOneBy({ username: ownerName });
        if (!owner) throw new Error(`No user "${ownerName}". Sign in to the app once first, then run the seed again.`);

        const groups = dataSource.getRepository(PlayGroup);
        if (!(await groups.findOneBy({ name: 'Seed Group', ownerId: owner.id }))) {
            await groups.save(groups.create({ name: 'Seed Group', description: 'Test players from the seed script', owner, ownerId: owner.id, members: [owner, ...players] }));
            console.log('Created play group "Seed Group"');
        }

        const leagues = dataSource.getRepository(League);
        if (!(await leagues.findOne({ where: { name: 'Seed League', created_by: { id: owner.id } } }))) {
            const league = await leagues.save(leagues.create({ name: 'Seed League', description: 'Test league from the seed script', start_date: new Date().toISOString().slice(0, 10), created_by: owner }));
            const participants = dataSource.getRepository(LeagueParticipant);
            await participants.save(players.map(user => participants.create({ league, user })));
            console.log('Created league "Seed League"');
        }
    }

    await dataSource.destroy();
    console.log('Seed completed.');
}

seed().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
