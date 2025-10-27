rm -r "$SPRITES"
cp -r $RSPRITES $SPRITES

$SCRIPTS/resize_sprites.sh

$SCRIPTS/copy_to_docs.sh
