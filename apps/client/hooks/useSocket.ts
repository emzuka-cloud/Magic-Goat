import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { fetchAuthSession } from 'aws-amplify/auth';
import { API_URL } from '../config';

/** Authenticated socket; the server puts it in the caller's `user_<id>` room. */
export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        let s: Socket | null = null;
        let cancelled = false;
        fetchAuthSession().then((session) => {
            const token = session.tokens?.idToken?.toString();
            if (cancelled || !token) return;
            s = io(API_URL, { transports: ['websocket'], auth: { token } });
            setSocket(s);
        }).catch(() => { /* not signed in: no live updates */ });

        return () => {
            cancelled = true;
            s?.disconnect();
        };
    }, []);

    return socket;
};
