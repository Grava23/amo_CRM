.PHONY: up prisma

COMPOSE_FILES = -f docker/docker-compose.yml

up: down
	docker compose $(COMPOSE_FILES) up -d --build

down:
	docker compose $(COMPOSE_FILES) down

prisma:
	npm run prisma:generate