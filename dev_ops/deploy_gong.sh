#!/bin/bash

#echo "$#"
#echo "$1"

mkdir -p /home/dhamma/projects/gong_dev_ops/dev_ops_logs
new_log_file=/home/dhamma/projects/gong_dev_ops/dev_ops_logs/dev_ops_log_$(date +"%Y_%m_%d_%H_%M_%S")_dev.log

USER=$(whoami)
mkdir -p /home/${USER}/projects/
mkdir -p /home/${USER}/projects/gong_dev_ops
cd /home/${USER}/projects/

git clone https://github.com/doron-mil/Gong-be.git
git clone https://github.com/doron-mil/Gong_fe.git

cp -rf /home/${USER}/projects/Gong-be/dev_ops /home/${USER}/projects/gong_dev_ops/
cp -f /home/${USER}/projects/gong_dev_ops/dev_ops/refresh_dev_ops.sh /home/${USER}/projects/gong_dev_ops/
cp -f /home/${USER}/projects/gong_dev_ops/dev_ops/refresh_gong_server.sh /home/${USER}/projects/gong_dev_ops/

export HISTIGNORE='*sudo -S*'
sudo -S /home/${USER}/projects/gong_dev_ops/dev_ops/refresh_gong_server_be.sh <<< $1
sudo -S /home/${USER}/projects/gong_dev_ops/dev_ops/refresh_gong_server_fe.sh <<< $1

