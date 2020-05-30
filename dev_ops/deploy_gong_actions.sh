#!/bin/bash

set -x

USER=$1
USER_PASS=$2
IS_DOCKER=$3

BASE_DIR="/home/${USER}/projects"
GONG_DEV_OPS_DIR="${BASE_DIR}/gong_dev_ops"
DEV_OPS_FILES_DIR="${GONG_DEV_OPS_DIR}/dev_ops"

set -v

# Essential dirs
mkdir -p "${BASE_DIR}"
mkdir -p "${GONG_DEV_OPS_DIR}"
mkdir -p "${GONG_DEV_OPS_DIR}/dev_ops_logs"
mkdir -p "${BASE_DIR}/gong_server"
cd "${BASE_DIR}/"

export HISTIGNORE='*sudo -S*'

# Getting the FE and BE
git clone https://github.com/doron-mil/Gong-be.git
git clone https://github.com/doron-mil/Gong_fe.git

# Populating the dev_ops
cp -rf "${BASE_DIR}/Gong-be/dev_ops" "${GONG_DEV_OPS_DIR}/"
cp -f "${DEV_OPS_FILES_DIR}/refresh_dev_ops.sh" "${GONG_DEV_OPS_DIR}/"
cp -f "${DEV_OPS_FILES_DIR}/refresh_gong_server.sh" "${GONG_DEV_OPS_DIR}/"

# Building the BE and FE
"${DEV_OPS_FILES_DIR}"/refresh_gong_server_be.sh "${USER}"
"${DEV_OPS_FILES_DIR}"/refresh_gong_server_fe.sh "${USER}"

# logrotate
sudo -S cp -f "${DEV_OPS_FILES_DIR}/gong_logrotate" /etc/logrotate.d/gong <<< "${USER_PASS}"
sudo -S sed -i "s/dhamma/${USER}/g" /etc/logrotate.d/gong <<< "${USER_PASS}"

# pm2 shell to start the app
sudo -S sed -i "s/dhamma/${USER}/g" "${DEV_OPS_FILES_DIR}/gong_server_pm2_config.json" <<< "${USER_PASS}"
"${DEV_OPS_FILES_DIR}"/create_pm2_gong_server_process.sh "${USER}" "${USER_PASS}" "${IS_DOCKER}"

# neutrelizing the old pathces scripts
PATCHES_INSTALLED_DIR="${DEV_OPS_FILES_DIR}/patches_installed"
mkdir -p "${PATCHES_INSTALLED_DIR}"
for path in $(find "${DEV_OPS_FILES_DIR}"/patches/*.sh ); do
  path_installed="${PATCHES_INSTALLED_DIR}/patches_installed/${path##*/}"
  touch "${path_installed}"
  echo neutrelizing patch "${path##*/}"
done
