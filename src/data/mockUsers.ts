
import type { User } from '../auth/types/AuthReducerInterfaces';

export const demoUser: User = {
    uid: 'demo-yeferson',
    fullName: 'Yeferson Grajales',
    username: 'yeferson',
    email: 'yeferson@example.com',
    photoURL: null,
};

const names = [
    ['Ana Torres', 'anatorres'], ['Bruno Díaz', 'brunodiaz'],
    ['Camila Rojas', 'camilarojas'], ['Diego López', 'diegolopez'],
    ['Elena Vargas', 'elenavargas'], ['Felipe Castro', 'felipecastro'],
    ['Gabriela Ruiz', 'gabrielaruiz'], ['Hugo Méndez', 'hugomendez'],
    ['Isabela Moreno', 'isabelamoreno'], ['Javier Pérez', 'javierperez'],
    ['Laura Gómez', 'lauragomez'], ['Mateo Silva', 'mateosilva'],
    ['Natalia Cruz', 'nataliacruz'], ['Óscar Reyes', 'oscarreyes'],
    ['Paula Herrera', 'paulaherrera'], ['Ricardo León', 'ricardoleon'],
    ['Sara Molina', 'saramolina'], ['Tomás Vega', 'tomasvega'],
    ['Valentina Ortiz', 'valentinaortiz'], ['Andrés Salas', 'andressalas'],
    ['Beatriz Luna', 'beatrizluna'], ['Carlos Peña', 'carlospena'],
    ['Daniela Arias', 'danielaarias'], ['Emilia Duarte', 'emiliaduarte'],
];

export const mockUsers: User[] = [
    demoUser,
    ...names.map(([fullName, username], index) => ({
        uid: `user-${index + 1}`,
        fullName,
        username,
        email: `${username}@example.com`,
        photoURL: null,
    })),
];
