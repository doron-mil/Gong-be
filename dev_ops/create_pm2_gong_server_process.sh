#!/bin/bash

USER=$1
USER_PASS=$2
IS_DOCKER=$3

set +o verbose
cd "/home/${USER}/projects/gong_server"

export HISTIGNORE='*sudo -S*'

if [ "${IS_DOCKER}" != "true" ]; then
  sudo -S pm2 start "/home/${USER}/projects/gong_dev_ops/dev_ops/gong_server_pm2_config.json" <<< "${USER_PASS}"
  # run
  #   pm2 startup -u root --hp /home/dhamma/projects/gong_server/
  # to get the needed sudo command to run like this :
  sudo env PATH="$PATH:/usr/bin" pm2 startup upstart -u root --hp "/home/${USER}" <<< "${USER_PASS}"
else
  # This is relevant only when used in docker env
  sudo -S pm2-runtime start "/home/${USER}/projects/gong_dev_ops/dev_ops/gong_server_pm2_config.json" <<< "${USER_PASS}"
  sudo env PATH="$PATH:/usr/bin" pm2-runtime startup upstart -u root --hp "/home/${USER_PASS}"
fi
