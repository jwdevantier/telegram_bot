FROM postgres:12.2

RUN apt-get update && apt-get install -y \
    postgresql-plpython3-12 \
&& apt install --no-install-recommends -y python3-pip \
&& pip3 install python-dateutil \
&& rm -rf /var/lib/apt/lists/*

COPY ./migrations /docker-entrypoint-initdb.d



