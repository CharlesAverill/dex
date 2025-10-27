identify -format "%w %h\n" $RSPRITES/*.gif | awk '{ if ($1 > maxw) maxw=$1; if ($2 > maxh) maxh=$2 } END { print maxw, maxh }'
