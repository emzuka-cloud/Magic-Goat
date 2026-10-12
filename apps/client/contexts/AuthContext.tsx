import React, { createContext, useContext, useState, useEffect } from 'react';
import { signIn, signUp, signOut, getCurrentUser, fetchAuthSession, signInWithRedirect } from 'aws-amplify/auth';
import { API_URL } from '../config';
import { apiErrorMessage } from '../utils/errors';

interface AuthContextType {
    user: any | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, name: string, username: string) => Promise<void>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const handleSignIn = async (email: string, password: string) => {
        try {
            await signIn({ username: email, password });

            // Create/link the user in the backend before entering the app, so account
            // problems (e.g. 409 email already in use) are shown on the login screen.
            let res: Response | undefined;
            try {
                const session = await fetchAuthSession();
                const token = session.tokens?.idToken?.toString();
                if (token) {
                    res = await fetch(`${API_URL}/users/me`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                }
            } catch (apiError) {
                // Server unreachable: let the user in; screens will show network errors.
                console.log('User sync API call failed:', apiError);
            }
            if (res && res.status >= 400 && res.status < 500) {
                const message = await apiErrorMessage(res, 'Could not load your account.');
                await signOut();
                throw new Error(message);
            }

            await checkAuth();
        } catch (error: any) {
            throw new Error(error.message || 'Sign in failed');
        }
    };

    const handleSignUp = async (email: string, password: string, name: string, username: string) => {
        try {
            // Generate a unique UserID: U- followed by 7 random digits
            const userId = `U-${Math.floor(1000000 + Math.random() * 9000000)}`;

            await signUp({
                username,
                password,
                options: {
                    userAttributes: {
                        email,
                        name,
                        nickname: userId, // Store UserID in nickname attribute
                    },
                },
            });
        } catch (error: any) {
            throw new Error(error.message || 'Sign up failed');
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            setUser(null);
        } catch (error: any) {
            throw new Error(error.message || 'Sign out failed');
        }
    };

    const handleSignInWithGoogle = async () => {
        try {
            await signInWithRedirect({ provider: 'Google' });
        } catch (error: any) {
            throw new Error(error.message || 'Google sign in failed');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                signIn: handleSignIn,
                signUp: handleSignUp,
                signOut: handleSignOut,
                signInWithGoogle: handleSignInWithGoogle,
                checkAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const getAuthToken = async (): Promise<string | null> => {
    try {
        const session = await fetchAuthSession();
        return session.tokens?.idToken?.toString() || null;
    } catch (error) {
        return null;
    }
};
