#!/bin/bash
set -e

git clone https://github.com/doron-mil/Gong-be.git ~/Gong-be
cp ~/Gong-be/dev_ops/deploy_gong.sh .
cp ~/Gong-be/dev_ops/deploy_gong_actions.sh .
rm -rf Gong-be
sudo -S chmod +x ./deploy_gong.sh <<< $2
sudo -S chmod +x ./deploy_gong_actions.sh <<< $2 
./deploy_gong.sh $1 $2 $3
bash
