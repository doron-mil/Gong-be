#!/bin/bash
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root"
   exit 1
fi

new_log_file=/home/dhamma/projects/gong_dev_ops/dev_ops_logs/dev_ops_log_$(date +"%Y_%m_%d_%H_%M_%S")_dev.log

set -x
set +v
echo -e "****************************************************************************************************" 2>&1 | tee -a "${new_log_file}"
echo -e "RUNNING SCRIPT :  refresh_dev_ops.sh     *****************   MAIN -- START    **********************" 2>&1 | tee -a "${new_log_file}"
echo -e "****************************************************************************************************" 2>&1 | tee -a "${new_log_file}"
echo -e "⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇⬇" 2>&1 | tee -a "${new_log_file}"
echo -e "****************************************************************************************************" 2>&1 | tee -a "${new_log_file}"

set -v
mkdir -p /home/dhamma/projects/gong_dev_ops/tmp 2>&1 | tee -a "${new_log_file}"
cp /home/dhamma/projects/gong_dev_ops/refresh_dev_ops_actions.sh  /home/dhamma/projects/gong_dev_ops/tmp 2>&1 | tee -a "${new_log_file}"
cd /home/dhamma/projects/gong_dev_ops/tmp
/home/dhamma/projects/gong_dev_ops/refresh_dev_ops_actions.sh 2>&1 | tee -a "${new_log_file}"

set +v
echo -e "****************************************************************************************************" 2>&1 | tee -a "${new_log_file}"
echo -e "⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆⬆" 2>&1 | tee -a "${new_log_file}"
echo -e "****************************************************************************************************" 2>&1 | tee -a "${new_log_file}"
echo -e " SCRIPT refresh_dev_ops.sh RUNNING HAS ENDED      *****************   MAIN -- END    ****************" 2>&1 | tee -a "${new_log_file}"
echo -e "****************************************************************************************************" 2>&1 | tee -a "${new_log_file}"

