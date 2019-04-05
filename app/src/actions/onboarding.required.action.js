import { ONBOARDING as type } from "./types";

export const REQUIRED = 'REQUIRED';

export const required = () => {
  return {
    type,
    action: REQUIRED
  };
};
