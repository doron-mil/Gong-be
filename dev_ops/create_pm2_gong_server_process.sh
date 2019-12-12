#!/bin/bash
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root"
   exit 1
fi
set +o verbose
cd /home/dhamma/projects/gong_server
pm2 start /home/dhamma/projects/gong_dev_ops/dev_ops/gong_server_pm2_config.json
