#!/bin/bash 
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 
   exit 1
fi
set -o verbose
cp -r  /home/dhamma/projects/gong_backups/0_last_update/* /home/dhamma/projects/gong_server/assets/

