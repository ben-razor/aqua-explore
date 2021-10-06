FROM python:3 

RUN apt-get update && apt-get install -y \
    software-properties-common \
    npm

RUN npm install npm@latest -g && \
    npm install n -g && \
    n latest

RUN npm -g install @fluencelabs/aqua

RUN npm -g install @fluencelabs/aqua-lib

COPY ./scripts/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

RUN apt-get install -y git
RUN git clone https://github.com/ben-razor/aqua-explore.git

EXPOSE 8082
EXPOSE 8080

ENTRYPOINT ./aqua-explore/scripts/start_frontend_server