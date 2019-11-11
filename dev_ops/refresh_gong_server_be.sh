#!/bin/bash
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 
   exit 1
fi
set -o verbose
cd /home/dhamma/projects/Gong-be
rm -rf node_modules
git fetch
git pull
npm i
npm run build
