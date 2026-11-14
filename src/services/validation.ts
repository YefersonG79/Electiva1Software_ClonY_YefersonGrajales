export const normalizeUsername = (value: string) => value.trim().replace(/^@/, '').toLowerCase();

export const validateUsername = (value: string) => {
    const username = normalizeUsername(value);
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
        throw new Error('El usuario debe tener entre 3 y 30 letras, números o guiones bajos.');
    }
    return username;
};

export const validateTweet = (value: string) => {
    const content = value.trim();
    if (!content) throw new Error('Escribe el contenido de tu tweet.');
    if ([...content].length > 280) throw new Error('El tweet no puede superar los 280 caracteres.');
    return content;
};
