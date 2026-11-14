
import type {
    AuthReducerAction,
    AuthState,
} from '../types/AuthReducerInterfaces';

export const authReducer = (
    state: AuthState,
    action: AuthReducerAction
): AuthState => {
    switch (action.type) {
        case 'loading':
            return { logged: false, user: null, loading: true, errorMessage: null };
        case 'login':
            return {
                loading: false,
                logged: true,
                user: action.payload,
                errorMessage: null,
            };

        case 'logout':
            return {
                loading: false,
                logged: false,
                user: null,
                errorMessage: null,
            };

        case 'error':
            return {
                ...state,
                loading: false,
                errorMessage: action.payload,
            };

        default:
            return state;
    }
};
