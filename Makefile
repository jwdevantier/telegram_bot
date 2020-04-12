
db-rebuild:
	$(MAKE) db-kill
	docker-compose build --no-cache db

db-kill:
	docker-compose rm -fsv db
	-docker volume rm bot_db_data

db-up:
	docker-compose up -d db
