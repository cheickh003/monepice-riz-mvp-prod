# Makefile pour MonEpiceRiz - Medusa.js Integration
.PHONY: help install dev build start stop clean migrate-data logs

# Configuration
COMPOSE_FILE = docker-compose.yml
PROJECT_NAME = monepiceriz

# Couleurs pour l'affichage
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[0;33m
BLUE = \033[0;34m
NC = \033[0m # No Color

help: ## Afficher cette aide
	@echo "$(GREEN)MonEpiceRiz - Commandes disponibles:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(BLUE)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Installer les dépendances et initialiser le projet
	@echo "$(YELLOW)📦 Installation des dépendances...$(NC)"
	@echo "$(BLUE)Frontend Next.js:$(NC)"
	cd frontend && npm install
	@echo "$(BLUE)Backend Medusa:$(NC)"
	cd backend && npm install
	@echo "$(GREEN)✅ Installation terminée!$(NC)"

init-medusa: ## Initialiser un nouveau projet Medusa dans le dossier backend
	@echo "$(YELLOW)🚀 Initialisation de Medusa.js...$(NC)"
	@if [ ! -d "backend/src" ]; then \
		cd backend && npx @medusajs/medusa-cli new . --skip-db; \
		echo "$(GREEN)✅ Medusa initialisé!$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  Medusa déjà initialisé$(NC)"; \
	fi

dev: ## Démarrer l'environnement de développement
	@echo "$(YELLOW)🚀 Démarrage de l'environnement de développement...$(NC)"
	docker-compose -f $(COMPOSE_FILE) up -d postgres redis minio
	@echo "$(BLUE)⏳ Attente des services de base...$(NC)"
	sleep 10
	docker-compose -f $(COMPOSE_FILE) up medusa_backend frontend
	@echo "$(GREEN)✅ Environnement de développement démarré!$(NC)"
	@echo "$(BLUE)Frontend: http://localhost:3000$(NC)"
	@echo "$(BLUE)Backend API: http://localhost:9000$(NC)"
	@echo "$(BLUE)Medusa Admin: http://localhost:7001$(NC)"

build: ## Construire les images Docker
	@echo "$(YELLOW)🔨 Construction des images Docker...$(NC)"
	docker-compose -f $(COMPOSE_FILE) build
	@echo "$(GREEN)✅ Images construites!$(NC)"

start: ## Démarrer tous les services en arrière-plan
	@echo "$(YELLOW)🚀 Démarrage de tous les services...$(NC)"
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)✅ Services démarrés!$(NC)"
	@make status

stop: ## Arrêter tous les services
	@echo "$(YELLOW)🛑 Arrêt des services...$(NC)"
	docker-compose -f $(COMPOSE_FILE) down
	@echo "$(GREEN)✅ Services arrêtés!$(NC)"

restart: ## Redémarrer tous les services
	@echo "$(YELLOW)🔄 Redémarrage des services...$(NC)"
	@make stop
	@make start

status: ## Afficher le statut des services
	@echo "$(BLUE)📊 Statut des services:$(NC)"
	@docker-compose -f $(COMPOSE_FILE) ps

logs: ## Afficher les logs de tous les services
	docker-compose -f $(COMPOSE_FILE) logs -f

logs-backend: ## Afficher les logs du backend Medusa
	docker-compose -f $(COMPOSE_FILE) logs -f medusa_backend

logs-frontend: ## Afficher les logs du frontend Next.js
	docker-compose -f $(COMPOSE_FILE) logs -f frontend

logs-db: ## Afficher les logs de PostgreSQL
	docker-compose -f $(COMPOSE_FILE) logs -f postgres

clean: ## Nettoyer les containers et volumes
	@echo "$(RED)🧹 Nettoyage des containers et volumes...$(NC)"
	@read -p "Êtes-vous sûr de vouloir supprimer tous les volumes? (y/N): " confirm && \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker-compose -f $(COMPOSE_FILE) down -v; \
		docker system prune -f; \
		echo "$(GREEN)✅ Nettoyage terminé!$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  Nettoyage annulé$(NC)"; \
	fi

migrate-dry: ## Tester la migration des données (dry run)
	@echo "$(YELLOW)🧪 Test de migration des données...$(NC)"
	cd scripts && node migrate-data.js --dry-run
	@echo "$(GREEN)✅ Test de migration terminé!$(NC)"

migrate-data: ## Migrer les données existantes vers Medusa
	@echo "$(YELLOW)📊 Migration des données vers Medusa...$(NC)"
	@read -p "Êtes-vous sûr de vouloir migrer les données? (y/N): " confirm && \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		cd scripts && node migrate-data.js; \
		echo "$(GREEN)✅ Migration terminée!$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  Migration annulée$(NC)"; \
	fi

migrate-categories: ## Migrer uniquement les catégories
	@echo "$(YELLOW)📂 Migration des catégories...$(NC)"
	cd scripts && node migrate-data.js --type=categories

migrate-products: ## Migrer uniquement les produits
	@echo "$(YELLOW)📦 Migration des produits...$(NC)"
	cd scripts && node migrate-data.js --type=products

db-shell: ## Accéder au shell PostgreSQL
	@echo "$(BLUE)🐘 Connexion à PostgreSQL...$(NC)"
	docker-compose -f $(COMPOSE_FILE) exec postgres psql -U medusa_user -d medusa_db

db-backup: ## Sauvegarder la base de données
	@echo "$(YELLOW)💾 Sauvegarde de la base de données...$(NC)"
	mkdir -p backups
	docker-compose -f $(COMPOSE_FILE) exec postgres pg_dump -U medusa_user medusa_db > backups/backup-$(shell date +%Y%m%d-%H%M%S).sql
	@echo "$(GREEN)✅ Sauvegarde créée dans le dossier backups/$(NC)"

db-restore: ## Restaurer la base de données (spécifier BACKUP_FILE=filename)
	@echo "$(YELLOW)🔄 Restauration de la base de données...$(NC)"
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "$(RED)❌ Spécifiez le fichier: make db-restore BACKUP_FILE=backup.sql$(NC)"; \
		exit 1; \
	fi
	docker-compose -f $(COMPOSE_FILE) exec -T postgres psql -U medusa_user -d medusa_db < $(BACKUP_FILE)
	@echo "$(GREEN)✅ Restauration terminée!$(NC)"

seed-dev: ## Insérer des données de test
	@echo "$(YELLOW)🌱 Insertion des données de test...$(NC)"
	docker-compose -f $(COMPOSE_FILE) exec medusa_backend npm run seed
	@echo "$(GREEN)✅ Données de test insérées!$(NC)"

admin-user: ## Créer un utilisateur admin
	@echo "$(YELLOW)👤 Création d'un utilisateur admin...$(NC)"
	docker-compose -f $(COMPOSE_FILE) exec medusa_backend npx medusa user -e admin@monepiceriz.com -p password123
	@echo "$(GREEN)✅ Utilisateur admin créé! Email: admin@monepiceriz.com, Password: password123$(NC)"

prod-build: ## Construire pour la production
	@echo "$(YELLOW)🏭 Construction pour la production...$(NC)"
	docker-compose -f $(COMPOSE_FILE) build --target production
	@echo "$(GREEN)✅ Images de production construites!$(NC)"

test: ## Exécuter les tests
	@echo "$(YELLOW)🧪 Exécution des tests...$(NC)"
	cd frontend && npm test
	cd backend && npm test
	@echo "$(GREEN)✅ Tests terminés!$(NC)"

lint: ## Vérifier le code (linting)
	@echo "$(YELLOW)🔍 Vérification du code...$(NC)"
	cd frontend && npm run lint
	cd backend && npm run lint
	@echo "$(GREEN)✅ Vérification terminée!$(NC)"

health: ## Vérifier la santé des services
	@echo "$(BLUE)🏥 Vérification de la santé des services:$(NC)"
	@echo "$(YELLOW)Frontend:$(NC)"
	@curl -f http://localhost:3000/api/health || echo "$(RED)❌ Frontend non accessible$(NC)"
	@echo "$(YELLOW)Backend API:$(NC)"
	@curl -f http://localhost:9000/health || echo "$(RED)❌ Backend non accessible$(NC)"
	@echo "$(YELLOW)Admin:$(NC)"
	@curl -f http://localhost:7001 || echo "$(RED)❌ Admin non accessible$(NC)"

setup: ## Configuration initiale complète du projet
	@echo "$(GREEN)🎯 Configuration initiale de MonEpiceRiz$(NC)"
	@make install
	@make init-medusa
	@make build
	@make start
	@echo "$(BLUE)⏳ Attente du démarrage des services...$(NC)"
	@sleep 30
	@make migrate-dry
	@echo "$(GREEN)🎉 Configuration terminée!$(NC)"
	@echo "$(BLUE)Prochaines étapes:$(NC)"
	@echo "  1. Exécuter: make migrate-data"
	@echo "  2. Créer un admin: make admin-user"
	@echo "  3. Accéder à http://localhost:3000"

deploy: ## Déployer en production (à personnaliser)
	@echo "$(RED)🚨 Commande de déploiement à personnaliser selon votre infrastructure$(NC)"
	@echo "$(YELLOW)Suggestions:$(NC)"
	@echo "  - Docker Swarm: docker stack deploy"
	@echo "  - Kubernetes: kubectl apply"
	@echo "  - VPS: rsync + docker-compose"

monitoring: ## Afficher les métriques de monitoring
	@echo "$(BLUE)📊 Métriques des containers:$(NC)"
	@docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"