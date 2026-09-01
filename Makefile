COLOR_RESET   = \033[0m
COLOR_INFO    = \033[32m
COLOR_COMMENT = \033[33m

CURRENT_DIR := $(shell pwd)
USER_ID       := $(shell id -u)
GROUP_ID      := $(shell id -g)
include .env

export CURRENT_DIR

.DEFAULT_GOAL := help

NODE_IMAGE     = node:24-alpine
DOCKER_COMPOSE = CURRENT_DIR=$(CURRENT_DIR) USER_ID=$(USER_ID) GROUP_ID=$(GROUP_ID) docker compose -f automation/docker-compose.yml
DOCKER_COMPOSE_BUILD = docker-compose --env-file .env -f automation/docker-compose-build.yml
DOCKER_RUN     = docker run --rm --user $(USER_ID):$(GROUP_ID) -v $(CURRENT_DIR):/workspace -w /workspace
DOCKER_RUN_ROOT = docker run --rm -v $(CURRENT_DIR):/workspace -w /workspace
BACKEND_DIR    = services/objects
USER_MODULE_DIR = services/shared/user-module
NEST_USER_MODULE_DIR = services/shared/nest-user-module
ANGULAR_USER_MODULE_DIR = front/shared/angular-user-module
SHELL_DIR      = front/shell

## Installer les dépendances (modules partagés + services + angular)
install: install_user_module install_nest_user_module install_angular_user_module install_service_objects install_shell

## Installer les dépendances user_module
install_user_module:
	@echo "${COLOR_INFO}Installation des dépendances user_module...${COLOR_RESET}"
	$(DOCKER_RUN) -e NODE_ENV=development -w /workspace/$(USER_MODULE_DIR) $(NODE_IMAGE) npm install

## Installer les dépendances nest_user_module
install_nest_user_module:
	@echo "${COLOR_INFO}Installation des dépendances nest_user_module...${COLOR_RESET}"
	$(DOCKER_RUN) -e NODE_ENV=development -w /workspace/$(NEST_USER_MODULE_DIR) $(NODE_IMAGE) npm install

## Installer les dépendances angular_user_module
install_angular_user_module:
	@echo "${COLOR_INFO}Installation des dépendances angular_user_module...${COLOR_RESET}"
	$(DOCKER_RUN) -e NODE_ENV=development -w /workspace/$(ANGULAR_USER_MODULE_DIR) $(NODE_IMAGE) npm install

## Installer les dépendances backend uniquement
install_service_objects:
	@echo "${COLOR_INFO}Installation des dépendances du services objects...${COLOR_RESET}"
	$(DOCKER_RUN) -e NODE_ENV=development -w /workspace/$(BACKEND_DIR) $(NODE_IMAGE) npm install

## Installer les dépendances shell Angular uniquement
install_shell:
	@echo "${COLOR_INFO}Installation des dépendances shell Angular...${COLOR_RESET}"
	$(DOCKER_RUN) -e NODE_ENV=development -w /workspace/$(SHELL_DIR) $(NODE_IMAGE) npm install

## Audit des dépendances (modules partagés + services + angular)
audit_fix:
	@echo "${COLOR_INFO}Audit user_module...${COLOR_RESET}"
	$(DOCKER_RUN) -e NODE_ENV=development -w /workspace/$(USER_MODULE_DIR) $(NODE_IMAGE) npm audit fix --force
	@echo "${COLOR_INFO}Audit nest_user_module...${COLOR_RESET}"
	$(DOCKER_RUN) -e NODE_ENV=development -w /workspace/$(NEST_USER_MODULE_DIR) $(NODE_IMAGE) npm audit fix --force
	@echo "${COLOR_INFO}Audit angular_user_module...${COLOR_RESET}"
	$(DOCKER_RUN) -e NODE_ENV=development -w /workspace/$(ANGULAR_USER_MODULE_DIR) $(NODE_IMAGE) npm audit fix --force
	@echo "${COLOR_INFO}Audit service_objects...${COLOR_RESET}"
	$(DOCKER_RUN) -e NODE_ENV=development -w /workspace/$(BACKEND_DIR) $(NODE_IMAGE) npm audit fix --force
	@echo "${COLOR_INFO}Audit shell...${COLOR_RESET}"
	$(DOCKER_RUN) -e NODE_ENV=development -w /workspace/$(SHELL_DIR) $(NODE_IMAGE) npm audit fix --force

## demarrage de keycloack
start_keycloack:
	@echo "${COLOR_INFO}Démarrage de Keycloak...${COLOR_RESET}"
	USER_ID=$(USER_ID) GROUP_ID=$(GROUP_ID) docker compose -f $(CURRENT_DIR)/automation/docker/compose/keycloack.yml up

down_keycloack:
	@echo "${COLOR_INFO}Démarrage de Keycloak...${COLOR_RESET}"
	USER_ID=$(USER_ID) GROUP_ID=$(GROUP_ID) docker compose -f $(CURRENT_DIR)/automation/docker/compose/keycloack.yml down

## Démarrer tous les services
start:
	@echo "${COLOR_INFO}Démarrage des services...${COLOR_RESET}"
	$(DOCKER_COMPOSE) up

start_service_objects:
	@echo "${COLOR_INFO}Démarrage du service objects...${COLOR_RESET}"
	$(DOCKER_COMPOSE) up service_objects

start_shell:
	@echo "${COLOR_INFO}Démarrage du shell Angular...${COLOR_RESET}"
	$(DOCKER_COMPOSE) up shell

## Arrêter tous les services
stop:
	@echo "${COLOR_INFO}Arrêt des services...${COLOR_RESET}"
	$(DOCKER_COMPOSE) down

## Redémarrer tous les services
restart: stop start

## Afficher les logs
logs:
	$(DOCKER_COMPOSE) logs -f

## Démarrer le service objects uniquement
start_service_objects:
	@echo "${COLOR_INFO}Démarrage du service objects...${COLOR_RESET}"
	$(DOCKER_COMPOSE) up service_objects

## Démarrer le shell Angular uniquement
start_shell:
	@echo "${COLOR_INFO}Démarrage du shell Angular...${COLOR_RESET}"
	$(DOCKER_COMPOSE) up shell

## Lancer les tests backend
test-backend:
	@echo "${COLOR_INFO}Tests backend...${COLOR_RESET}"
	@mkdir -p $(CURRENT_DIR)/coverage/back
	$(DOCKER_RUN) -w /workspace/$(BACKEND_DIR) -e NODE_ENV=test $(NODE_IMAGE) npm test

## Lancer les tests e2e backend
test-e2e:
	@echo "${COLOR_INFO}Tests e2e backend...${COLOR_RESET}"
	@mkdir -p $(CURRENT_DIR)/coverage/e2e
	$(DOCKER_RUN) -w /workspace/$(BACKEND_DIR) -e NODE_ENV=test $(NODE_IMAGE) npm run test:e2e

## Lancer les tests shell Angular
test-shell:
	@echo "${COLOR_INFO}Tests shell Angular...${COLOR_RESET}"
	@mkdir -p $(CURRENT_DIR)/coverage/front
	$(DOCKER_RUN_ROOT) -w /workspace/$(SHELL_DIR) -e NODE_ENV=test $(NODE_IMAGE) sh -c "apk add --no-cache chromium && CHROME_BIN=/usr/bin/chromium npm run test -- --watch=false --karma-config=karma.docker.conf.js --browsers=ChromeHeadlessNoSandbox"

## Lancer tous les tests
test: test-backend test-e2e test-shell

## Build de production (modules partagés + backend + shell angular)
build:
	@echo "${COLOR_INFO}Build de production...${COLOR_RESET}"
	$(DOCKER_RUN) -w /workspace/$(USER_MODULE_DIR) $(NODE_IMAGE) npm run build
	$(DOCKER_RUN) -w /workspace/$(NEST_USER_MODULE_DIR) $(NODE_IMAGE) npm run build
	$(DOCKER_RUN) -w /workspace/$(ANGULAR_USER_MODULE_DIR) $(NODE_IMAGE) npm run build
	$(DOCKER_RUN) -w /workspace/$(BACKEND_DIR) $(NODE_IMAGE) npm run build
	$(DOCKER_RUN) -w /workspace/$(SHELL_DIR) $(NODE_IMAGE) npm run build

## Lint du contrat OpenAPI
lint-api:
	@echo "${COLOR_INFO}Validation du contrat OpenAPI...${COLOR_RESET}"
	docker run --rm -v $(CURRENT_DIR):/spec redocly/cli lint /spec/openapi.yml

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
