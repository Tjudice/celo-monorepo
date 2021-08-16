#!/usr/bin/env bash
set -euo pipefail

# Funds a burner account with CELO on a specific network
#
# Flags:
# -k: Private key of address to send funds from
# -a: Amount of Celo to send to burner (optional)

KEY=""
AMOUNT=""

while getopts 'k:a:' flag; do
  case "${flag}" in
    k) KEY="${OPTARG}" ;;
    a) AMOUNT="--amount ${OPTARG}" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$KEY" ] && echo "Need to set the KEY via the -k flag" && exit 1;

yarn run truffle exec ./scripts/truffle/fund_burner_account.js \
  --key $KEY \
  $AMOUNT