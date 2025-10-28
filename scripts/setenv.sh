SCRIPT_PATH="$(realpath "${BASH_SOURCE[0]}")"
export PROJECT_ROOT=$(dirname $(dirname $SCRIPT_PATH))
export SCRIPTS="$PROJECT_ROOT/scripts"
export RSPRITES="$PROJECT_ROOT/static/raw_sprites"
export SPRITES="$PROJECT_ROOT/static/assets/sprites"
export ORSPRITES="$PROJECT_ROOT/static/raw_overworld_sprites"
export OSPRITES="$PROJECT_ROOT/static/assets/overworld_sprites"
