#!/bin/bash 
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 
   exit 1
fi
set -o verbose
cp -rf  /home/dhamma/projects/gong_backups/0_last_update/assets/* /home/dhamma/projects/gong_server/assets/

