#!/bin/bash

#echo "$#"
#echo "$1"

USER=$1
USER_PASS=$2
IS_DOCKER=$3

set -v

# Essential dirs
mkdir -p "/home/${USER}/projects/"
mkdir -p "/home/${USER}/projects/gong_dev_ops"
mkdir -p "/home/${USER}/projects/gong_dev_ops/dev_ops_logs"
mkdir -p "/home/${USER}/projects/gong_server"
cd "/home/${USER}/projects/"

export HISTIGNORE='*sudo -S*'

# Getting the FE and BE
git clone https://github.com/doron-mil/Gong-be.git
git clone https://github.com/doron-mil/Gong_fe.git

# Populating the dev_ops
cp -rf "/home/${USER}/projects/Gong-be/dev_ops" "/home/${USER}/projects/gong_dev_ops/"
cp -f "/home/${USER}/projects/gong_dev_ops/dev_ops/refresh_dev_ops.sh" "/home/${USER}/projects/gong_dev_ops/"
cp -f "/home/${USER}/projects/gong_dev_ops/dev_ops/refresh_gong_server.sh" "/home/${USER}/projects/gong_dev_ops/"

# Building the BE and FE
/home/"${USER}"/projects/gong_dev_ops/dev_ops/refresh_gong_server_be.sh "${USER}"
/home/"${USER}"/projects/gong_dev_ops/dev_ops/refresh_gong_server_fe.sh "${USER}"

# logrotate
sudo -S cp -f "/home/${USER}/projects/gong_dev_ops/dev_ops/gong_logrotate" /etc/logrotate.d/gong <<< "${USER_PASS}"
sudo -S sed -i 's/dhamma/${USER}/g' /etc/logrotate.d/gong <<< "${USER_PASS}"

# pm2 shell to start the app
sudo -S sed -i 's/dhamma/${USER}/g' "/home/${USER}/projects/gong_dev_ops/dev_ops/gong_server_pm2_config.json" <<< "${USER_PASS}"
/home/"${USER}"/projects/gong_dev_ops/dev_ops/create_pm3_gong_server_process.sh "${USER}" "${USER_PASS}" "${IS_DOCKER}"
