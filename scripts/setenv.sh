SCRIPT_PATH="$(realpath "${BASH_SOURCE[0]}")"
export PROJECT_ROOT=$(dirname $(dirname $SCRIPT_PATH))
export SCRIPTS="$PROJECT_ROOT/scripts"
export RSPRITES="$PROJECT_ROOT/raw_sprites"
export SPRITES="$PROJECT_ROOT/sprites"
