read MAX_W MAX_H < <( $SCRIPTS/largest.sh )

files=($SPRITES/*.gif)
total=${#files[@]}
count=0

for f in "${files[@]}"; do
    ((count++))
    printf "\r[%3d/%3d] Resizing %-40s" "$count" "$total" "$(basename "$f")"

    convert "$f" -coalesce \
        -background none \
        -gravity south \
        -extent ${MAX_W}x${MAX_H} \
        -layers optimize \
        "$f" &

	if [[ $(jobs -r -p | wc -l) -ge $(nproc) ]]; then
        # now there are $N jobs already running, so wait here for any job
        # to be finished so there is a place to start next one.
        wait -n
    fi
done

echo -e "\nResizing complete"

