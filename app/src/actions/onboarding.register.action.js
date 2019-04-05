import { ONBOARDING as type } from "./types";
import { register as registerService } from '../services/register.service';

export const REGISTER = 'REGISTER';

export const register = (profile) => {
    registerService(profile);

    return {
        type,
        action: REGISTER,
        profile
    };
};