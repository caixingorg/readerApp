export type EnvType = 'dev' | 'staging' | 'prod';

export interface Environment {
    id: EnvType;
    label: string;
    apiUrl: string;
    webUrl: string;
}

export const DEFAULT_ENVIRONMENTS: Record<EnvType, Environment> = {
    dev: {
        id: 'dev',
        label: 'Dev',
        apiUrl: 'https://dev-api.readerapp.com', // Placeholder
        webUrl: 'https://dev.readerapp.com',
    },
    staging: {
        id: 'staging',
        label: 'Staging',
        apiUrl: 'https://staging-api.readerapp.com',
        webUrl: 'https://staging.readerapp.com',
    },
    prod: {
        id: 'prod',
        label: 'Prod',
        apiUrl: 'https://api.readerapp.com',
        webUrl: 'https://readerapp.com',
    },
};

export interface DevStoreState {
    // Environment
    currentEnvId: EnvType;
    customApiUrl: string | null;
    customWebUrl: string | null;

    // UI
    isMenuVisible: boolean;

    // Actions
    setEnvId: (id: EnvType) => void;
    setCustomUrl: (type: 'api' | 'web', url: string | null) => void;
    toggleMenu: (visible?: boolean) => void;
}
