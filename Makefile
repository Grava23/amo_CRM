.PHONY: up migrate-dev prisma

COMPOSE_FILES = -f docker/docker-compose.yml

up: down
	docker compose $(COMPOSE_FILES) up -d --build

down:
	docker compose $(COMPOSE_FILES) down

prisma:
	npm run prisma:generate

migrate-dev:
	@read -p "Enter migration name: " name; \
	DATABASE_URL="postgresql://postgres:8MQ8SoGwuo@localhost:5432/neuro_okk_amo?sslmode=disable" \
	npx prisma migrate dev --name $${name}
