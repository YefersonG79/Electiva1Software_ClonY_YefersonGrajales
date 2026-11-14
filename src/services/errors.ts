const messages: Record<string, string> = {
    'auth/email-already-in-use': 'Este correo ya está registrado.',
    'auth/invalid-email': 'Escribe un correo electrónico válido.',
    'auth/weak-password': 'Usa una contraseña de al menos 6 caracteres.',
    'auth/password-does-not-meet-requirements': 'La contraseña no cumple la política configurada en Firebase.',
    'auth/invalid-credential': 'Usuario o contraseña incorrectos.',
    'auth/wrong-password': 'Usuario o contraseña incorrectos.',
    'auth/user-not-found': 'Usuario o contraseña incorrectos.',
    'auth/invalid-custom-token': 'No se pudo validar la sesión. Inténtalo de nuevo.',
    'auth/network-request-failed': 'No hay conexión con Firebase. Revisa tu conexión e inténtalo de nuevo.',
    'auth/popup-closed-by-user': 'Se cerró la ventana de Google antes de completar el acceso.',
    'auth/cancelled-popup-request': 'Se canceló la solicitud de Google. Inténtalo de nuevo.',
    'auth/popup-blocked': 'Permite las ventanas emergentes para iniciar sesión con Google.',
    'auth/account-exists-with-different-credential': 'Este correo utiliza otro proveedor. Inicia sesión con tu método original.',
    'auth/operation-not-allowed': 'El proveedor de acceso no está habilitado en Firebase Console.',
    'auth/unauthorized-domain': 'Agrega este dominio a los dominios autorizados de Firebase Authentication.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos antes de volver a intentar.',
    'functions/unauthenticated': 'Usuario o contraseña incorrectos.',
    'functions/resource-exhausted': 'Demasiados intentos. Espera 15 minutos antes de volver a intentar.',
    'functions/unavailable': 'El servicio de acceso no está disponible. Inténtalo de nuevo.',
    'functions/internal': 'No se pudo iniciar sesión. Revisa la configuración de la función de acceso.',
    'functions/failed-precondition': 'El servicio de acceso necesita configuración en Firebase.',
    'permission-denied': 'No tienes permiso para realizar esta operación. Vuelve a iniciar sesión e inténtalo de nuevo.',
    'unavailable': 'No se pudo conectar con Firestore. Inténtalo de nuevo.',
    'failed-precondition': 'No pudimos cargar los datos en este momento. Inténtalo de nuevo en unos minutos.',
};

// Keep the original SDK error (including any index creation link) in developer tools.
// Context must describe the query only; never pass passwords, emails or tokens.
export const reportFirestoreError = (context: string, error: unknown) => {
    console.error(`[Clon_Y] ${context}`, error);
};

export const errorMessage = (error: unknown): string => {
    if (typeof error === 'object' && error && 'code' in error && typeof error.code === 'string') {
        return messages[error.code] || 'No se pudo completar la operación. Inténtalo de nuevo.';
    }
    return error instanceof Error ? error.message : 'Ocurrió un error inesperado. Inténtalo de nuevo.';
};
