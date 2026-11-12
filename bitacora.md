# AI interaction log

This file records the interaction available for Milestone 2. No existing log was present in the initial working tree. Missing earlier conversations, timestamps and progressive commits cannot be reconstructed and are not fabricated.

## Milestone 2 interaction ? 2026-11-12 00:56:44 -05:00 (America/Bogota)

Tool: Codex. The exact serving model variant is not exposed in this session.

### Student prompt (verbatim attached text)

```text
# Clon_Y — Desarrollo completo del Milestone 2

Actúa como un desarrollador Full Stack Senior especializado en React 19, TypeScript, Vite, Firebase Authentication, Cloud Firestore, React Router DOM y Git.

Estamos desarrollando el proyecto académico **Clon_Y**, una SPA inspirada en la red social X (Twitter).

Repositorio:
https://github.com/YefersonG79/Electiva1Software_ClonY_YefersonGrajales

El Milestone 1 implementó la estructura de navegación, las páginas, los componentes reutilizables, los datos simulados y las funcionalidades visuales de la aplicación.

Ahora debemos implementar **el Milestone 2: Funcionalidades de Usuario y Publicación de Tweets**, siguiendo el documento académico actualizado `Clon de X.docx`.

## 1. Objetivo general

Convertir las funcionalidades simuladas correspondientes al Milestone 2 en funcionalidades reales, utilizando Firebase Authentication y Cloud Firestore.

La implementación debe realizarse en una única rama denominada:

`feature/milestone-2`

El resultado debe ser una aplicación funcional que conserve las características del Milestone 1 y se encuentre preparada para implementar el Milestone 3 posteriormente.

## 2. Revisión inicial obligatoria

Antes de escribir código:

1. Inspecciona la estructura completa del repositorio.
2. Verifica qué rama contiene la versión completa y estable del Milestone 1.
3. Comprueba si `developer` ya contiene esa versión.
4. Si `developer` todavía no tiene integrado el Milestone 1, no construyas el Milestone 2 sobre una versión incompleta. Informa la situación y utiliza como base la rama verificada del Milestone 1, previa comprobación.
5. Inspecciona la configuración actual de Firebase.
6. Identifica los componentes que utilizan datos simulados.
7. Identifica las funciones y servicios que deben adaptarse para utilizar Firebase.
8. Presenta un resumen del plan de implementación.

No reconstruyas el proyecto desde cero.

## 3. Registro real de usuarios

Implementa el registro de usuarios mediante Firebase Authentication y Firestore.

Requisitos:

- Nombre completo.
- Nombre de usuario.
- Correo electrónico.
- Contraseña.
- Validar campos obligatorios.
- Validar el formato del correo.
- Comprobar que el correo no esté registrado.
- Comprobar que el nombre de usuario no esté ocupado.
- Crear la cuenta mediante Firebase Authentication.
- Guardar el perfil del usuario en Firestore.
- Utilizar el UID de Firebase como identificador principal.
- Mostrar mensajes de éxito y error.

La validación del nombre de usuario debe ser segura frente a registros simultáneos. No dependas únicamente de consultar si existe antes de guardar; utiliza un mecanismo de reserva de nombres mediante transacción o una alternativa equivalente.

## 4. Inicio de sesión

Implementa la autenticación real utilizando Firebase Authentication.

La aplicación debe permitir:

- Iniciar sesión mediante nombre de usuario y contraseña.
- Iniciar sesión mediante Google.
- Cerrar sesión.
- Mantener la sesión activa al actualizar el navegador.
- Identificar al usuario autenticado.
- Proteger las rutas privadas.

Firebase Authentication utiliza normalmente correo electrónico y contraseña. Para permitir el inicio de sesión por nombre de usuario, implementa una resolución segura entre el nombre de usuario y la identidad correspondiente.

No almacenes contraseñas en Firestore ni en localStorage.

Utiliza los proveedores y el contexto de autenticación existentes siempre que sea posible.

Si Google Authentication requiere activación o configuración manual en Firebase Console, documenta claramente los pasos.

## 5. Publicación real de tweets

Implementa el almacenamiento de publicaciones en Cloud Firestore.

Cada publicación debe contener, como mínimo:

- Identificador del tweet.
- UID del autor.
- Contenido.
- Fecha y hora de publicación.

Requisitos funcionales:

1. Permitir escribir un tweet.
2. Validar que el contenido no esté vacío.
3. Limitar el contenido a un máximo de 280 caracteres.
4. Guardar el tweet en Firestore.
5. Utilizar una marca de tiempo generada por el servidor.
6. Mostrar una notificación cuando la publicación sea exitosa.
7. Mostrar un mensaje apropiado si ocurre un error.
8. Actualizar la visualización de publicaciones después de publicar.

No implementes edición, eliminación, comentarios, retweets ni funciones ajenas al alcance académico.

## 6. Contadores de seguidores y seguidos

Los contadores deben representar los datos reales almacenados en Firestore.

Requisitos:

- Mostrar el número de seguidores.
- Mostrar el número de usuarios seguidos.
- Actualizar los contadores cuando cambien las relaciones.
- Reutilizar `UserStats` y los componentes existentes.

No utilices valores fijos para los contadores del usuario autenticado.

## 7. Consultar tweets de seguidores y seguidos

Implementa la consulta de tweets de los usuarios que aparecen en las listas de seguidores y seguidos.

Requisitos:

- Permitir abrir el perfil de otro usuario.
- Consultar sus publicaciones almacenadas en Firestore.
- Mostrar las publicaciones desde la más reciente hasta la más antigua.
- Conservar el formato visual del Milestone 1.
- Respetar la paginación de máximo 10 publicaciones cuando corresponda.
- Mostrar correctamente los estados de carga, ausencia de resultados y errores.

Reutiliza los componentes existentes para no duplicar código.

## 8. Seguir usuarios por nombre de usuario

Implementa un mecanismo para localizar y seguir usuarios mediante su nombre de usuario.

Requisitos:

1. Crear o adaptar un formulario de búsqueda por nombre de usuario.
2. Consultar el usuario correspondiente en Firestore.
3. Permitir seguir al usuario encontrado.
4. Comprobar si ya existe la relación.
5. Evitar que un usuario se siga a sí mismo.
6. Evitar relaciones duplicadas, incluso ante solicitudes concurrentes.
7. Notificar cuando se siga correctamente a un usuario.
8. Notificar si ya se está siguiendo.
9. Actualizar los contadores correspondientes.

La relación de seguimiento debe quedar almacenada en Firestore y persistir después de recargar la aplicación.

## 9. Arquitectura y organización

Conserva la arquitectura actual del repositorio.

Puedes incorporar una capa de servicios para Firebase si es necesaria, por ejemplo:

- Servicios de autenticación.
- Servicios de usuarios.
- Servicios de tweets.
- Servicios de seguimiento.
- Hooks para consultas asíncronas.

No es obligatorio utilizar estos nombres o crear estas carpetas si la arquitectura existente ofrece una solución más coherente.

Prioriza reutilizar:

- AuthProvider.
- AuthContext.
- useAuth.
- MockDataProvider y sus interfaces, cuando resulte apropiado.
- TweetCard.
- TweetForm.
- TweetList.
- UserCard.
- UserStats.
- FollowButton.
- Las páginas y rutas existentes.

Si es necesario reemplazar responsabilidades de los datos simulados, hazlo sin alterar innecesariamente las interfaces públicas de los componentes.

Mantén los mocks disponibles únicamente para las funcionalidades que todavía dependan de ellos o para pruebas, evitando mezclar datos simulados y persistentes de forma inconsistente.

## 10. Seguridad de Firebase

Implementa o prepara las reglas de seguridad necesarias para Firestore.

Deben garantizar que:

- Los usuarios autenticados puedan modificar únicamente su perfil autorizado.
- Solo el autor autenticado pueda publicar tweets con su identidad.
- El contenido de las publicaciones respete las restricciones definidas.
- Solo el usuario autenticado pueda crear relaciones de seguimiento en las que actúe como seguidor.
- No se puedan suplantar identificadores de otros usuarios.
- Las reservas de nombres de usuario no puedan apropiarse indebidamente.
- Las lecturas necesarias para las funcionalidades del proyecto estén permitidas.

No utilices reglas abiertas de lectura y escritura indiscriminadas.

No publiques credenciales privadas, claves administrativas ni archivos de cuentas de servicio.

Utiliza variables de entorno cuando corresponda y prepara un `.env.example` sin valores sensibles.

Documenta los pasos necesarios para configurar las reglas e índices de Firestore.

## 11. Experiencia de usuario

Conserva el diseño visual y la navegación implementados en el Milestone 1.

Agrega únicamente los elementos necesarios para las nuevas funcionalidades:

- Mensajes de carga.
- Notificaciones de éxito.
- Mensajes de error.
- Estados de botones durante operaciones.
- Validaciones de formularios.
- Mensajes cuando no existan resultados.

Evita rediseñar la aplicación.

## 12. Pruebas y verificaciones

Ejecuta:

`npm run lint`

`npm run build`

Además, verifica los siguientes escenarios:

- Registro exitoso.
- Intento de registro con nombre de usuario existente.
- Intento de registro con correo existente.
- Inicio de sesión válido.
- Inicio de sesión inválido.
- Inicio de sesión mediante Google.
- Persistencia de sesión.
- Cierre de sesión.
- Publicación válida.
- Publicación vacía.
- Publicación que exceda 280 caracteres.
- Consulta de tweets.
- Visualización de seguidores y seguidos.
- Búsqueda de usuarios.
- Seguimiento exitoso.
- Intento de seguimiento duplicado.
- Actualización de contadores.
- Comportamiento al recargar el navegador.

Las pruebas que requieran credenciales o configuración externa deben identificarse claramente si no se pueden ejecutar.

No declares una funcionalidad verificada cuando no exista evidencia de su ejecución.

## 13. Documentación

Actualiza:

- `README.md`.
- Documentación de verificación del Milestone 2.
- Instrucciones de configuración de Firebase.
- Reglas e índices de Firestore, cuando corresponda.

Incluye las nuevas variables de entorno requeridas, instrucciones de ejecución y configuración manual del proyecto Firebase.

## 14. GitHub — Una sola entrega

Todo el desarrollo se realizará sobre:

`feature/milestone-2`

No crees ramas adicionales para las funcionalidades individuales.

Realiza los cambios necesarios en el espacio de trabajo, ejecuta las verificaciones y prepara una única entrega del Milestone 2.

No realices commit, push, merge ni pull request automáticamente.

Cuando termine la implementación y se hayan revisado los cambios, el desarrollador realizará:

`git commit -m "feat: implemented milestone 2 Firebase functionalities"`

Posteriormente se publicará la rama y se creará una Pull Request hacia `developer`, siempre que esta contenga la versión validada del Milestone 1.

## 15. Resultado esperado

Al finalizar, presenta:

1. Resumen de funcionalidades implementadas.
2. Lista de archivos nuevos y modificados.
3. Configuración necesaria en Firebase Console.
4. Reglas de seguridad e índices necesarios.
5. Resultados de las pruebas.
6. Requisitos pendientes o bloqueados.
7. Diferencias respecto al Milestone 1.
8. Estado del proyecto para su publicación en GitHub.

**Restricción principal:** no modificar el alcance de los milestones anteriores ni implementar características reservadas para el Milestone 3, salvo las operaciones mínimas de seguimiento necesarias para cumplir los requisitos explícitos del Milestone 2.

Comienza inspeccionando el repositorio y ejecuta el desarrollo completo del Milestone 2 una vez validada la base de trabajo.
```

### Response and incorporated outputs

The assistant inspected the existing repository, local branches and academic DOCX before editing. It verified the clean `feature/milestone-2` base at `946542a` and confirmed the Milestone 1 integration is already in local `developer`. It retained the existing React layouts and components, connected Firebase Authentication and Firestore, added a callable function for private username/password resolution, transactional username reservations and follow records, real tweets and live counters, search, asynchronous feedback, security rules, indexes, environment templates and repeatable tests.

Executed evidence includes successful lint/build, 14 local Firebase integration check groups and 17 browser check groups. The browser verified duplicate account feedback, rollback, publication, session/data persistence, following, pagination and navigation. Real Google OAuth, deployed indexes, real-project rules/functions deployment and production IAM remain owner-configured manual checks; emulator results are not described as production verification.

The incorporated source changes and their file inventory are recorded in [the Milestone 2 verification report](docs/milestone-2-verification.md#files-added-and-changed). [The Firebase setup guide](docs/firebase-setup.md) documents the server, variables, Console settings, rules, indexes and reproduction. The full generated source is present in those linked repository files; local screenshots/results are ignored test artifacts.

No commit, push, merge, PR, billing change or production deployment was performed. The existing stash was left untouched. The request reserves the final Git commit for the developer.
