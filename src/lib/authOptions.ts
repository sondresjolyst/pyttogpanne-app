import axios from "axios";
import CredentialsProvider from "next-auth/providers/credentials";
import jwt from "jsonwebtoken";
import type { NextAuthOptions, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import UserService, { RefreshTokenRejectedError } from "@/services/userService";
import { SESSION_ERRORS, isTerminalSessionError } from "@/lib/sessionExpiry";

type DecodedToken = {
    sub: string;
    unique_name: string;
    email: string;
    role?: string | string[];
    nbf: number;
    exp: number;
    iat: number;
    iss: string;
    aud: string;
};

type ExtendedUser = {
    id: string;
    name: string;
    email: string;
    roles: string[];
    accessToken: string;
    refreshToken: string;
};

const ABSOLUTE_SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

// Refresh this far before the access token expires, so it is renewed while the user is idle
// rather than in the middle of their next save.
const MAX_REFRESH_SKEW_MS = 5 * 60 * 1000;

// Used when a refreshed token cannot be read. Short, because the session is then holding
// tokens whose expiry is unknown.
const UNKNOWN_EXPIRY_RETRY_MS = 60 * 1000;

function parseApiToken(token: string): DecodedToken {
    const secret = process.env.PYTTOGPANNE_API_JWT_SECRET;
    if (!secret) {
        throw new Error('PYTTOGPANNE_API_JWT_SECRET is not configured. Refusing to accept unverified API tokens.');
    }
    return jwt.verify(token, secret) as DecodedToken;
}

function rolesOf(decoded: DecodedToken): string[] {
    const raw = decoded.role;
    return Array.isArray(raw) ? raw : raw ? [raw] : [];
}

// Never more than a quarter of the token's own lifetime, so a shorter-lived API token cannot
// put every single session read into a refresh.
function nextRefreshAt(decoded: DecodedToken): number {
    const lifetimeMs = Math.max(0, (decoded.exp - decoded.iat) * 1000);
    return decoded.exp * 1000 - Math.min(MAX_REFRESH_SKEW_MS, lifetimeMs / 4);
}

// next-auth runs the jwt callback once per session read, and parallel reads all carry the same
// refresh token. The API rotates on every call, so letting them all through would make the
// losers present a consumed token and trip its replay detection, which revokes every device.
// Collapse concurrent refreshes of one token into a single request.
const inFlight = new Map<string, Promise<JWT>>();

function refreshOnce(token: JWT): Promise<JWT> {
    const key = token.refreshToken as string;
    const existing = inFlight.get(key);
    if (existing) return existing;

    const pending = rotate(token).finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
    return pending;
}

async function rotate(token: JWT): Promise<JWT> {
    let refreshed;
    try {
        refreshed = await UserService.refreshToken({
            token: token.accessToken as string,
            refreshToken: token.refreshToken as string,
        });
    } catch (error) {
        if (error instanceof RefreshTokenRejectedError) {
            return { ...token, error: SESSION_ERRORS.refreshRejected } as JWT;
        }
        // A network blip or an API restart must not end the session. Keep the token so a later
        // read tries again. Log the shape only, never the error object: an AxiosError carries
        // the request config, and the refresh body holds both tokens.
        console.error("Refresh token request failed, keeping the session", {
            status: axios.isAxiosError(error) ? error.response?.status : undefined,
            code: axios.isAxiosError(error) ? error.code : undefined,
            message: error instanceof Error ? error.message : String(error),
        });
        return token;
    }

    // The API has rotated by this point, so the new tokens must be kept whatever happens below.
    // Discarding them would leave the session holding a consumed token, and presenting that
    // again is what revokes every refresh token the user has.
    const next: JWT = {
        ...token,
        accessToken: refreshed.token,
        refreshToken: refreshed.refreshToken,
        error: undefined,
    };

    try {
        const decoded = parseApiToken(refreshed.token);
        next.refreshAt = nextRefreshAt(decoded);
        next.user = { ...(token.user as NonNullable<JWT["user"]>), roles: rolesOf(decoded) };
    } catch (error) {
        // The token is ours but unreadable (clock skew against its nbf, a rotated secret).
        // Retry shortly with the refresh token we just received.
        console.error("Could not read the refreshed access token, retrying shortly", {
            message: error instanceof Error ? error.message : String(error),
        });
        next.refreshAt = Date.now() + UNKNOWN_EXPIRY_RETRY_MS;
    }

    return next;
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials) {
                    throw new Error("Credentials are missing");
                }
                try {
                    const user = await UserService.login({
                        email: credentials.email,
                        password: credentials.password,
                    });
                    if (user) {
                        const decodedToken = parseApiToken(user.token);
                        return {
                            id: decodedToken.sub,
                            name: decodedToken.unique_name,
                            email: credentials.email,
                            roles: rolesOf(decodedToken),
                            accessToken: user.token,
                            refreshToken: user.refreshToken,
                        } as ExtendedUser;
                    }
                    return null;
                } catch (error) {
                    console.error("Error in authorize function:", error);
                    throw new Error("Invalid email or password");
                }
            }
        }),
    ],
    pages: {
        signIn: "/login",
    },
    session: {
        maxAge: 7 * 24 * 60 * 60,
    },
    jwt: {
        secret: process.env.NEXTAUTH_SECRET,
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                const decodedToken = parseApiToken((user as ExtendedUser).accessToken);
                token.accessToken = (user as ExtendedUser).accessToken;
                token.refreshToken = (user as ExtendedUser).refreshToken;
                token.refreshAt = nextRefreshAt(decodedToken);
                token.loginAt = Date.now();
                token.error = undefined;
                token.user = {
                    id: user.id,
                    name: user.name ?? '',
                    email: user.email ?? '',
                    roles: (user as ExtendedUser).roles,
                };
            }

            if (token.loginAt && Date.now() - (token.loginAt as number) > ABSOLUTE_SESSION_MAX_AGE) {
                return { ...token, error: SESSION_ERRORS.absoluteExpiry } as JWT;
            }

            // Nothing but a new sign-in recovers a terminal session, so stop asking the API.
            // Every pointless attempt is another chance to present a consumed token.
            if (isTerminalSessionError(token.error)) {
                return token;
            }

            if (token.refreshAt && Date.now() < (token.refreshAt as number)) {
                return token;
            }

            if (!token.refreshToken) {
                return { ...token, error: SESSION_ERRORS.noRefreshToken } as JWT;
            }

            return refreshOnce(token);
        },
        async session({ session, token }: { session: Session; token: JWT }) {
            session.user = token.user!;
            session.accessToken = token.accessToken!;
            session.error = token.error;
            // The absolute cap cannot be refreshed away, so the UI needs it to warn in advance.
            session.absoluteExpiresAt = token.loginAt ? token.loginAt + ABSOLUTE_SESSION_MAX_AGE : undefined;
            return session;
        },
    },
};
