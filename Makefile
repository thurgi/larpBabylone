COLOR_RESET   = \033[0m
COLOR_INFO    = \033[32m
COLOR_COMMENT = \033[33m

current_dir := $(shell pwd)
USER_ID       := $(shell id -u)
GROUP_ID      := $(shell id -g)
include .env
export

.DEFAULT_GOAL := help

NODE_IMAGE     = node:20-alpine
DOCKER_COMPOSE = USER_ID=$(USER_ID) GROUP_ID=$(GROUP_ID) docker-compose -f automation/docker-compose.yml
DOCKER_COMPOSE_BUILD = docker-compose --env-file .env -f automation/docker-compose-build.yml
DOCKER_RUN     = docker run --rm --user $(USER_ID):$(GROUP_ID)

## Installer les dépendances (backend + frontend + auth-service)
install: install-auth install-backend install-frontend

## Installer les dépendances auth-service uniquement
install-auth:
	@echo "${COLOR_INFO}Installation des dépendances auth-service...${COLOR_RESET}"
	$(DOCKER_RUN) -v $(current_dir)/auth-service:/app -w /app $(NODE_IMAGE) npm install

## Installer les dépendances backend uniquement
install-backend:
	@echo "${COLOR_INFO}Installation des dépendances backend...${COLOR_RESET}"
	$(DOCKER_RUN) -v $(current_dir)/backend:/app -w /app $(NODE_IMAGE) npm install

## Installer les dépendances frontend uniquement
install-frontend:
	@echo "${COLOR_INFO}Installation des dépendances frontend...${COLOR_RESET}"
	$(DOCKER_RUN) -v $(current_dir)/frontend:/app -w /app $(NODE_IMAGE) npm ci

## Démarrer tous les services
start:
	@echo "${COLOR_INFO}Démarrage des services...${COLOR_RESET}"
	$(DOCKER_COMPOSE) up -d

## Arrêter tous les services
stop:
	@echo "${COLOR_INFO}Arrêt des services...${COLOR_RESET}"
	$(DOCKER_COMPOSE) down

## Redémarrer tous les services
restart: stop start

## Afficher les logs
logs:
	$(DOCKER_COMPOSE) logs -f

## Lancer les tests backend
test-backend:
	@echo "${COLOR_INFO}Tests backend...${COLOR_RESET}"
	@mkdir -p $(current_dir)/coverage/back
	$(DOCKER_RUN) -v $(current_dir)/backend:/app -v $(current_dir)/coverage:/app/coverage -w /app -e NODE_ENV=test $(NODE_IMAGE) npm test

## Lancer les tests e2e backend
test-e2e:
	@echo "${COLOR_INFO}Tests e2e backend...${COLOR_RESET}"
	@mkdir -p $(current_dir)/coverage/e2e
	$(DOCKER_RUN) -v $(current_dir)/backend:/app -v $(current_dir)/coverage:/app/coverage -w /app -e NODE_ENV=test $(NODE_IMAGE) npm run test:e2e

## Lancer les tests frontend
test-frontend:
	@echo "${COLOR_INFO}Tests frontend...${COLOR_RESET}"
	@mkdir -p $(current_dir)/coverage/front
	$(DOCKER_RUN) -v $(current_dir)/frontend:/app -v $(current_dir)/coverage:/coverage -w /app -e NODE_ENV=test $(NODE_IMAGE) npm test

## Lancer tous les tests
test: test-backend test-e2e test-frontend

## Build de production (backend + frontend)
build:
	@echo "${COLOR_INFO}Build de production...${COLOR_RESET}"
	$(DOCKER_RUN) -v $(current_dir)/backend:/app -w /app $(NODE_IMAGE) npm run build
	$(DOCKER_RUN) -v $(current_dir)/frontend:/app -w /app $(NODE_IMAGE) npm run build
	$(DOCKER_RUN) -v $(current_dir)/auth-service:/app -w /app $(NODE_IMAGE) npm run build

## Lint du contrat OpenAPI
lint-api:
	@echo "${COLOR_INFO}Validation du contrat OpenAPI...${COLOR_RESET}"
	docker run --rm -v $(current_dir):/spec redocly/cli lint /spec/openapi.yml

## Construire les images Docker de production
docker-build: build
	@echo "${COLOR_INFO}Construction de l'image frontend...${COLOR_RESET}"
	docker build -f automation/docker/Dockerfile.frontend -t larpbabylone-frontend .
	@echo "${COLOR_INFO}Construction de l'image backend...${COLOR_RESET}"
	docker build -f automation/docker/Dockerfile.backend --build-arg NODE_IMAGE=$(NODE_IMAGE) -t larpbabylone-backend .

## Démarrer les containers de production (images buildées)
start-build:
	@echo "${COLOR_INFO}Démarrage des containers de production...${COLOR_RESET}"
	$(DOCKER_COMPOSE_BUILD) up

## Arrêter les containers de production
stop-build:
	@echo "${COLOR_INFO}Arrêt des containers de production...${COLOR_RESET}"
	$(DOCKER_COMPOSE_BUILD) down

help:
	@printf "${COLOR_COMMENT}Usage:${COLOR_RESET}\n"
	@printf " make [target]\n\n"
	@printf "${COLOR_COMMENT}Available targets:${COLOR_RESET}\n"
	@awk '/^[a-zA-Z\-_0-9\.@]+:/ { \
		helpMessage = match(lastLine, /^## (.*)/); \
		if (helpMessage) { \
			helpCommand = substr($$1, 0, index($$1, ":")); \
			helpMessage = substr(lastLine, RSTART + 3, RLENGTH); \
			printf " ${COLOR_INFO}%-16s${COLOR_RESET} %s\n", helpCommand, helpMessage; \
		} \
	} \
	{ lastLine = $$0 }' $(MAKEFILE_LIST)
