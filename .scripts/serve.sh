#!/bin/bash

INSPECT_FLAG=""
if [[ "$1" == "-i" || "$1" == "--inspect" ]]; then
  INSPECT_FLAG="--inspect"
elif [[ "$1" == "-ib" || "$1" == "--inspect-brk" ]]; then
  INSPECT_FLAG="--inspect-mode brk"
fi

supabase functions serve --no-verify-jwt $INSPECT_FLAG