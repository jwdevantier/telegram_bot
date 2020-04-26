# 'make' will list all documented targets, see https://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
.DEFAULT_GOAL := help
.PHONY: help
help:
	@echo "\033[33mAvailable targets, for more information, see \033[36mREADME.md\033[0m"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: db-rebuild
db-rebuild:  ## rebuild database from scratch
	$(MAKE) db-destroy
	docker-compose build --no-cache db

.PHONY: db-destroy
db-destroy:  ## remove database container and contents.
	docker-compose rm -fsv db
	-docker volume rm bot_db_data

.PHONY: db-up
db-up:  ## start database
	docker-compose up -d db

.PHONY: db-dev
dev:  ## dev mode, watch & reload on changes
	source PROG.env && npm run watch
