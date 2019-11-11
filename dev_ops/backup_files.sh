#!/bin/bash 
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 
   exit 1
fi
set -o verbose
now=$(date +"%Y_%m_%d_%H_%M_%S")
mkdir -p /home/dhamma/projects/gong_backups
mkdir /home/dhamma/projects/gong_backups/${now}
mkdir -p /home/dhamma/projects/gong_backups/0_last_update
rm -rf /home/dhamma/projects/gong_backups/0_last_update/*
cp -r /home/dhamma/projects/gong_server/assets/ /home/dhamma/projects/gong_backups/${now}
cp -r /home/dhamma/projects/gong_server/assets/ /home/dhamma/projects/gong_backups/0_last_update

