
import { mockUsers } from './mockUsers';
import type { Tweet } from './types';

const messages = [
    'Hoy cambié la pantalla por un paseo. A veces las mejores ideas aparecen cuando dejamos de buscarlas.',
    'Construir algo en equipo también es aprender a escuchar. Me quedo con las conversaciones de hoy.',
    'Un café, una libreta y una idea por desarrollar. Así empieza un buen día ☕',
    'Pequeños avances también cuentan. Hoy terminé esa tarea que llevaba días posponiendo.',
    '¿Cuál es ese libro al que siempre vuelven? Estoy preparando mi próxima lista de lectura.',
    'Compartir lo que aprendemos hace el camino un poco más fácil para alguien más.',
    'Una tarde de lluvia y música tranquila. No necesito mucho más para empezar a crear.',
    'Mi parte favorita de un proyecto es ese momento en el que todo empieza a tomar forma.',
    'Hoy probé una ruta nueva para volver a casa. Mi ciudad todavía tiene mucho por mostrarme.',
    'Las buenas preguntas abren conversaciones que no sabíamos que necesitábamos.',
    'Un recordatorio para mí: descansar también forma parte del proceso.',
    'Dejo por aquí una idea: empezar con algo pequeño y mejorarlo cada día.',
    'Hay personas que hacen que un día común se vuelva especial. Gracias a mi comunidad.',
    'Cerrando la semana con nuevos aprendizajes y muchas ganas de seguir construyendo.',
];

const latestDate = Date.parse('2026-10-28T21:00:00-05:00');

// Store oldest first so the views must apply their required newest-first ordering.
export const mockTweets: Tweet[] = Array.from({ length: 14 }, (_, round) =>
    mockUsers.map((user, index) => ({
        id: `tweet-${round}-${user.uid}`,
        authorId: user.uid,
        content: messages[(round + index) % messages.length],
        createdAt: new Date(latestDate - (round * mockUsers.length + index) * 600_000).toISOString(),
    })),
).flat().reverse();
