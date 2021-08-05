#!/usr/bin/env bash

NETWORK=""
VERSION=""
BRANCH=""
PRIVKEY=""
PASSWORD=""

while getopts 'n:v:b:k:p:' flag; do
  case "${flag}" in
    b) BRANCH="${OPTARG}" ;;
    n) NETWORK="${OPTARG}" ;;
    v) VERSION="${OPTARG}" ;;
    k) PRIVKEY="${OPTARG}" ;;
    p) PASSWORD="${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done


cd ..

npm install --global yarn
yarn
yarn lerna bootstrap
yarn lerna run build --ignore docs

# brew tap ethereum/ethereum
# brew install ethereum

sudo add-apt-repository -y ppa:ethereum/ethereum
sudo apt-get update
sudo apt-get install ethereum


export CELO_IMAGE=us.gcr.io/celo-org/geth:$NETWORK
docker pull $CELO_IMAGE
mkdir celo-data-dir
# cd celo-data-dir:/root/.celo
ls
mv UTC--2021-08-04T04-11-41.231375000Z--7c3ed16519eeceb354ac2d88a6a6722a3a9eb886 ~/home/runner/.ethereum/keystore

cd celo-data-dir
DATA_DIR="/root/.celo"
export NETWORK_OPTION="--$NETWORK"
docker run --name celo-lightestnode -d --restart unless-stopped --stop-timeout 300 -p 127.0.0.1:8545:8545 -p 127.0.0.1:8546:8546 -p 30303:30303 -p 30303:30303/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --syncmode lightest --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal --light.serve 90 --light.maxpeers 1000 --maxpeers 1100 --nousb $NETWORK_OPTION --datadir /root/.celo
echo -n 'Trevor' > secret.txt
# geth account new --password secret.txt
docker run --rm --net=host -v $DATA_DIR:$DATA_DIR --entrypoint /bin/sh -i $CELO_IMAGE -c "geth account import --datadir '~/home/runner/.ethereum' --password secret.txt UTC--2021-08-04T04-11-41.231375000Z--7c3ed16519eeceb354ac2d88a6a6722a3a9eb886"
docker info
ls
pwd
# cd account/accountSecret
# echo -n $PASSWORD > password.txt
# cd ../../..