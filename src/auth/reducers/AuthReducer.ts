
import type {
    AuthReducerAction,
    AuthState,
} from '../types/AuthReducerInterfaces';

export const authReducer = (
    state: AuthState,
    action: AuthReducerAction
): AuthState => {
    switch (action.type) {
        case 'login':
            return {
                logged: true,
                user: action.payload,
                errorMessage: null,
            };

        case 'logout':
            return {
                logged: false,
                user: null,
                errorMessage: null,
            };

        case 'error':
            return {
                ...state,
                errorMessage: action.payload,
            };

        default:
            return state;
    }
};
