import { useState, useCallback } from 'react';

export type Player = {
    id: number;
    life: number;
    name: string;
    color: string;
    commanderDamage: Record<number, number>; // damage received from player ID
    poison: number;
};

export const useGameEngine = (initialPlayerCount: number = 4, startingLife: number = 40) => {
    const [players, setPlayers] = useState<Player[]>(() => {
        return Array.from({ length: initialPlayerCount }, (_, i) => ({
            id: i,
            life: startingLife,
            name: `Player ${i + 1}`,
            color: ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899'][i % 6],
            commanderDamage: {},
            poison: 0,
        }));
    });

    const modifyLife = useCallback((playerId: number, amount: number) => {
        setPlayers((prev) =>
            prev.map((p) => (p.id === playerId ? { ...p, life: p.life + amount } : p))
        );
    }, []);

    const resetGame = useCallback((playerCount: number, life: number) => {
        setPlayers(
            Array.from({ length: playerCount }, (_, i) => ({
                id: i,
                life: life,
                name: `Player ${i + 1}`,
                color: ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899'][i % 6],
                commanderDamage: {},
                poison: 0,
            }))
        );
    }, []);

    const updatePlayerName = useCallback((playerId: number, name: string) => {
        setPlayers((prev) =>
            prev.map((p) => (p.id === playerId ? { ...p, name } : p))
        );
    }, []);

    const applyCommanderDamage = useCallback((targetPlayerId: number, attackerPlayerId: number, amount: number) => {
        setPlayers((prev) =>
            prev.map((p) => {
                if (p.id === targetPlayerId) {
                    const currentDamage = p.commanderDamage[attackerPlayerId] || 0;
                    return {
                        ...p,
                        life: p.life - amount, // Deduct life
                        commanderDamage: {
                            ...p.commanderDamage,
                            [attackerPlayerId]: currentDamage + amount,
                        },
                    };
                }
                return p;
            })
        );
    }, []);

    const modifyPoison = useCallback((playerId: number, amount: number) => {
        setPlayers((prev) =>
            prev.map((p) => (p.id === playerId ? { ...p, poison: Math.max(0, p.poison + amount) } : p))
        );
    }, []);

    return {
        players,
        modifyLife,
        resetGame,
        updatePlayerName,
        applyCommanderDamage,
        modifyPoison,
    };
};
