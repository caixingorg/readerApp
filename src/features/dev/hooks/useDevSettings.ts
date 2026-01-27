import { useDevStore } from '../stores/devStore';
import { DEFAULT_ENVIRONMENTS, Environment } from '../config/types';

export const useDevSettings = () => {
    const { currentEnvId, customApiUrl, customWebUrl } = useDevStore();

    const currentEnv: Environment = DEFAULT_ENVIRONMENTS[currentEnvId];

    // Compute effective URLs (Custom overrides Base)
    const effectiveApiUrl = customApiUrl || currentEnv.apiUrl;
    const effectiveWebUrl = customWebUrl || currentEnv.webUrl;

    return {
        env: currentEnv.id,
        label: currentEnv.label,
        apiUrl: effectiveApiUrl,
        webUrl: effectiveWebUrl,
        isCustom: !!customApiUrl || !!customWebUrl,
    };
};
