import { ONBOARDING as type } from "./types";
import { unregister as unregisterService } from '../services/register.service';

export const UNREGISTER = 'UNREGISTER';

export const unregister = () => {
    unregisterService();

    return {
        type,
        action: UNREGISTER
    };
};