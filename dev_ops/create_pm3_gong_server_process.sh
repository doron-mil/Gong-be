#!/bin/bash

USER=$1
USER_PASS=$2
IS_DOCKER=$3

set +o verbose
cd "/home/${USER}/projects/gong_server"

export HISTIGNORE='*sudo -S*'

if [ "${IS_DOCKER}" != "true" ]; then
  echo 1111 "${USER}" "${USER_PASS}" "${IS_DOCKER}"
else
  echo 2222 "${USER}" "${USER_PASS}" "${IS_DOCKER}"
fi
