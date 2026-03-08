FROM mysql:8.0
COPY backend/src/models/schema.sql /docker-entrypoint-initdb.d/01-schema.sql
