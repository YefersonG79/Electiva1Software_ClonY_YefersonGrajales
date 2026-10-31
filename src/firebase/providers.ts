interface AuthResult {
    ok: true;
    uid: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
}

interface AuthErrorResult {
    ok: false;
    errorMessage: string;
}

// Preserve the reference API signature while real authentication is out of scope.
export const loginUserByCredentials: (
    email: string,
    password: string,
) => Promise<AuthResult | AuthErrorResult> = async () => ({
    ok: false,
    errorMessage: 'Firebase Authentication is disabled in Milestone 1. Use the simulated AuthProvider.',
});
