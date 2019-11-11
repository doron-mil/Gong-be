#!/bin/bash
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 
   exit 1
fi
set -o verbose
/home/dhamma/projects/gong_dev_ops/server-stop.sh
/home/dhamma/projects/gong_dev_ops/refresh_gong_server_be.sh
/home/dhamma/projects/gong_dev_ops/refresh_gong_server_fe.sh
/home/dhamma/projects/gong_dev_ops/server-start.sh
