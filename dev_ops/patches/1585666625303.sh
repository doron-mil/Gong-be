#!/bin/bash

USER=$1
USER_PASS=$2
IS_DOCKER=$3

#######################
#######################
#######################
#BASE_DIR=/home/"${USER}"/projects
BASE_DIR=~/WebstormProjects/vipassana

########################
########################
#######################
# DEV_OPS_DIR="${BASE_DIR}"/gong_dev_ops
DEV_OPS_DIR="${BASE_DIR}"/"${USER}"/dev_ops

UPDATED_ASSETS_DIR="${BASE_DIR}"/Gong-be/assets
INSTALLED_ASSETS_DIR="${BASE_DIR}"/gong_server/assets

node "${DEV_OPS_DIR}"/patches/code/1585666625303.js "${UPDATED_ASSETS_DIR}" "${INSTALLED_ASSETS_DIR}"
