# Proyecto Final DAM

## Descripción General
Este proyecto es una aplicación móvil construida utilizando Expo y React Native. Incluye funcionalidades de autenticación de usuarios con opciones de inicio de sesión y registro.

## Estructura del Proyecto
```
Proyecto-Final-DAM
├── src
│   ├── App.js
│   ├── config
│   │   └── firebase.js
│   ├── pages
│   │   ├── CrearConcurso.js
│   │   ├── FichaConcurso.js
│   │   ├── ForgotPassword.js
│   │   ├── Galeria.js
│   │   ├── Home.js
│   │   ├── ListadoConcursos.js
│   │   ├── listaUsuarios.js
│   │   ├── Login.js
│   │   ├── PanelAdmin.js
│   │   ├── Perfil.js
│   │   ├── RankingConcurso.js
│   │   └── Register.js
│   ├── services
│   │   ├── authService.js
│   │   ├── contestService.js
│   │   ├── countdownService.js
│   │   ├── dateService.js
│   │   ├── imageService.js
│   │   ├── userService.js
│   │   └── validationService.js
├── index.js                # Punto de entrada de la aplicación
├── package.json            # Dependencias y scripts del proyecto
└── README.md               # Documentación del proyecto
```

## Descripción Detallada del Proyecto

### `src/App.js`
Este es el componente principal de la aplicación. Utiliza `react-navigation` para manejar la navegación entre diferentes pantallas. Define dos navegadores:
- `Stack Navigator`: Para la autenticación (Login, Register, ForgotPassword).
- `Tab Navigator`: Para la aplicación principal (Home, Perfil, PanelAdmin).

Utiliza `Firebase` para la autenticación y gestiona el estado del usuario (`currentUser`, `isAdminUser`).

### `src/config/firebase.js`
Este archivo contiene la configuración de Firebase para la aplicación. Inicializa Firebase y exporta la instancia de autenticación (`FIREBASE_AUTH`).

### `src/pages/`
Este directorio contiene los componentes de las diferentes páginas de la aplicación:
- `Login.js`: Componente para la página de inicio de sesión.
- `Register.js`: Componente para la página de registro.
- `Home.js`: Componente para la página principal.
- `PanelAdmin.js`: Componente para el panel de administración.
- `ForgotPassword.js`: Componente para la página de recuperación de contraseña.
- `Perfil.js`: Componente para la página de perfil del usuario.
- `ListadoConcursos.js`: Componente para listar los concursos.
- `FichaConcurso.js`: Componente para mostrar la ficha de un concurso.
- `CrearConcurso.js`: Componente para crear un nuevo concurso.
- `ListaUsuarios.js`: Componente para listar los usuarios.
- `Galeria.js`: Componente para la galería de imágenes.
- `RankingConcurso.js`: Componente para mostrar el ranking de un concurso.

### `src/services/`
Este directorio contiene los servicios utilizados por la aplicación:
- `authService.js`: Contiene funciones para la autenticación de usuarios (`logoutUser`, `isAdmin`).
- `contestService.js`: Contiene funciones para la gestión de concursos.
- `countdownService.js`: Contiene funciones para el manejo de cuenta regresiva.
- `dateService.js`: Contiene funciones para el manejo de fechas.
- `imageService.js`: Contiene funciones para la gestión de imágenes.
- `userService.js`: Contiene funciones para la gestión de usuarios.
- `validationService.js`: Contiene funciones para la validación de datos.

## Dependencias

- `@react-navigation/stack`: Se utiliza para la navegación entre pantallas en forma de pila (stack). Implementado en `src/App.js`.
- `@react-navigation/bottom-tabs`: Se utiliza para la navegación con pestañas en la parte inferior de la pantalla. Implementado en `src/App.js`.
- `@react-navigation/native`: Es el core de la librería de react-navigation. Implementado en `src/App.js`.
- `expo`: Framework para crear aplicaciones universales de React.
- `firebase`: Se utiliza para la autenticación y gestión de datos en la nube. Implementado en `src/config/firebase.js` y `src/services/authService.js`.
- `react`: Librería para construir interfaces de usuario.
- `react-native`: Framework para construir aplicaciones nativas con React.
- `react-native-vector-icons`: Se utiliza para mostrar iconos vectoriales. Implementado en `src/App.js`.

## Instalación
Para comenzar con el proyecto, clona el repositorio e instala las dependencias:

```bash
git clone <repository-url>
cd Proyecto-Final-DAM
npm install
```

## Ejecución de la Aplicación
Puedes iniciar la aplicación utilizando el siguiente comando:

```bash
npm start
```

Esto abrirá las herramientas de desarrollador de Expo en tu navegador. Luego, puedes ejecutar la aplicación en un simulador de Android o iOS, o en un dispositivo físico utilizando la aplicación Expo Go.

## Características
- Inicio de sesión y registro de usuarios
- Integración de Firebase para la autenticación
- Gestión de concursos
- Panel de administración
- Perfil de usuario
- Galería de imágenes
- Ranking de concursos

## Contribución
Siéntete libre de enviar problemas o pull requests para mejoras o correcciones de errores.
