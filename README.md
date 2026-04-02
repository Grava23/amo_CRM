# amo_CRM
Настройка ОКК в проекте на амо CRM 

## Миграция БД

1. Поднять проект локально

```bash
    make up
```

2. Сгенерировать миграцию

```bash
    DATABASE_URL="postgresql://user:password@localhost:5432/db_name?sslmode=disable" \
    npx prisma migrate dev --name migration_name
```

Либо делаем сразу 2 шаг, но указываем удаленную бд