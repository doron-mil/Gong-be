#!/bin/bash
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root"
   exit 1
fi
mkdir -p /home/dhamma/projects/gong_dev_ops/dev_ops_logs

new_log_file=/home/dhamma/projects/gong_dev_ops/dev_ops_logs/dev_ops_log_$(date +"%Y_%m_%d_%H_%M_%S").log

set -x

echo -e "****************************************************************************************************" 2>&1 | tee -a "${new_log_file}"
echo -e "RUNNING SCRIPT :  refresh_gong_server.sh **************   MAIN -- START    *************************" 2>&1 | tee -a "${new_log_file}"
echo -e "****************************************************************************************************" 2>&1 | tee -a "${new_log_file}"
echo -e "⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇" 2>&1 | tee -a "${new_log_file}"
echo -e "****************************************************************************************************" 2>&1 | tee -a "${new_log_file}"
echo
echo


set -v
/home/dhamma/projects/gong_dev_ops/dev_ops/server_stop.sh 2>&1 | tee -a "${new_log_file}"
/home/dhamma/projects/gong_dev_ops/dev_ops/refresh_gong_server_be.sh 2>&1 | tee -a "${new_log_file}"
/home/dhamma/projects/gong_dev_ops/dev_ops/refresh_gong_server_fe.sh 2>&1 | tee -a "${new_log_file}"
/home/dhamma/projects/gong_dev_ops/dev_ops/server_start.sh 2>&1 | tee -a "${new_log_file}"
set +v

echo
echo
echo -e "****************************************************************************************************" 2>&1 | tee -a "${new_log_file}"
echo -e "⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆" 2>&1 | tee -a "${new_log_file}"
echo -e "****************************************************************************************************" 2>&1 | tee -a "${new_log_file}"
echo -e "SCRIPT refresh_gong_server.sh RUNNING HAS ENDED  *****************   MAIN -- END    ****************" 2>&1 | tee -a "${new_log_file}"
echo -e "****************************************************************************************************" 2>&1 | tee -a "${new_log_file}"
