import { defineSessionConfig } from '@sjolystinnovation/app-kit';

export const sessionConfig = defineSessionConfig({
    jwtSecretEnvVar: 'PYTTOGPANNE_API_JWT_SECRET',
    loginRoute: '/login',
    draftStoragePrefix: 'pyttogpanne',
});
