-- SQL Table creation statements based on colecciones.json (MySQL/MariaDB compatible)

CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    role LONGTEXT,
    createdAt DATETIME,
    avatar VARCHAR(255)
);

CREATE TABLE concursos (
    id VARCHAR(255) PRIMARY KEY,
    nombreEvento VARCHAR(255),
    tema VARCHAR(255),
    fechaInicio DATETIME,
    fechaFin DATETIME,
    fechaFinVotacion DATETIME,
    descripcion VARCHAR(255),
    imagenConcursoUrl VARCHAR(255),
    estado VARCHAR(255),
    creatorId VARCHAR(255),
    usersId LONGTEXT,
    createdAt DATETIME
);

CREATE TABLE participacionesConcurso (
    id VARCHAR(255) PRIMARY KEY,
    concursoId VARCHAR(255),
    userId VARCHAR(255),
    imagenes LONGTEXT
);

CREATE TABLE blockedUsers (
    id VARCHAR(255) PRIMARY KEY,
    blocked TINYINT(1),
    blockedAt DATETIME
);

CREATE TABLE userContestVotingStats (
    id VARCHAR(255) PRIMARY KEY,
    distinctImagesVotedCount INTEGER,
    imagesVotedSet LONGTEXT,
    lastVotedTimestamp DATETIME
);
