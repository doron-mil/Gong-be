#!/bin/bash

set -x

USER=$1
USER_PASS=$2
IS_DOCKER=$3

log_file=/home/${USER}/projects/gong_dev_ops/dev_ops_logs/0_initial_deployment_$(date +"%Y_%m_%d_%H_%M_%S").log

/home/"${USER}"/deploy_gong_actions.sh "${USER}" "${USER_PASS}" "${IS_DOCKER}" 2>&1 | tee -a "${log_file}"
