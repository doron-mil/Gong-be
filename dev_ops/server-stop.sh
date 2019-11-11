#!/bin/bash 
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 
   exit 1
fi
set -o verbose
pm2 stop gong_server
logrotate /home/dhamma/projects/gong_dev_ops/gong_logrotate  -fv -s /home/dhamma/projects/gong_dev_ops/t_logrotate_state
/home/dhamma/projects/gong_dev_ops/backup_files.sh
rm -rf /home/dhamma/projects/gong_server/*
