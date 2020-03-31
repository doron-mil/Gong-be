#!/bin/bash

USER=$1
USER_PASS=$2
IS_DOCKER=$3

mkdir -p "/home/${USER}/projects/gong_dev_ops/dev_ops_logs"

new_log_file=/home/${USER}/projects/gong_dev_ops/dev_ops_logs/dev_ops_log_$(date +"%Y_%m_%d_%H_%M_%S").log

set -x

echo -e "****************************************************************************************************" 2>&1 | tee -a "${new_log_file}"
echo -e "RUNNING SCRIPT :  refresh_gong_server.sh **************   MAIN -- START    *************************" 2>&1 | tee -a "${new_log_file}"
echo -e "****************************************************************************************************" 2>&1 | tee -a "${new_log_file}"
echo -e "⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇" 2>&1 | tee -a "${new_log_file}"
echo -e "****************************************************************************************************" 2>&1 | tee -a "${new_log_file}"
echo
echo


set -v
/home/"${USER}"/projects/gong_dev_ops/dev_ops/server_stop.sh "${USER}" "${USER_PASS}" "${IS_DOCKER}" 2>&1 | tee -a "${new_log_file}"
/home/"${USER}"/projects/gong_dev_ops/dev_ops/refresh_gong_server_be.sh "${USER}" "${USER_PASS}" 2>&1 | tee -a "${new_log_file}"
/home/"${USER}"/projects/gong_dev_ops/dev_ops/refresh_gong_server_fe.sh "${USER}" 2>&1 | tee -a "${new_log_file}"
/home/"${USER}"/projects/gong_dev_ops/dev_ops/server_start.sh "${USER}" "${USER_PASS}" "${IS_DOCKER}" 2>&1 | tee -a "${new_log_file}"
set +v

echo
echo
echo -e "****************************************************************************************************" 2>&1 | tee -a "${new_log_file}"
echo -e "⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆" 2>&1 | tee -a "${new_log_file}"
echo -e "****************************************************************************************************" 2>&1 | tee -a "${new_log_file}"
echo -e "SCRIPT refresh_gong_server.sh RUNNING HAS ENDED  *****************   MAIN -- END    ****************" 2>&1 | tee -a "${new_log_file}"
echo -e "****************************************************************************************************" 2>&1 | tee -a "${new_log_file}"
