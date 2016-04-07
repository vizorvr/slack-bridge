NAME=slack-bridge

# source environment variables from local file
. ./env

# update from git
git pull --rebase

# build docker container
docker build -t $NAME:v1 .

# destroy existing container
docker stop $NAME
docker rm $NAME

# start container
docker run -d --name $NAME \
    -e "SLACKBOT_TOKEN=$SLACKBOT_TOKEN" \
     --link redis:redis $NAME:v1
