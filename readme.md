# T120B165 Saityno taikomųjų programų projektavimas

1. Create .env file:

```sh
touch .env
```

2. Modify the file to have these params:

```
# Postgres
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
POSTGRES_PORT=5432
POSTGRES_HOST=postgres

# Backend
PORT=3001
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
NODE_ENV=production

```

3. Run `docker compose up` or `docker-compose up`.
