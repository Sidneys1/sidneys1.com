#!/usr/bin/env bash

d_flag='8'
c_flag='100'

print_usage() {
  printf 'Usage: %s [-d DEPTH] [-c COLORS] FILE\n\nFlags:\n  -d DEPTH\tBit depth (default: 8).\n  -c COLORS\tColor table size (default: 100).\n' "$(basename "$0")";
}

while getopts 'd:c:h' flag; do
  case "${flag}" in
    d) d_flag="${OPTARG}" ;;
    c) c_flag="${OPTARG}" ;;
    *) print_usage
       exit 1 ;;
  esac
done
shift $(expr "${OPTIND}" - 1 )

function yes_or_no {
    while true; do
        read -N1 -p "$* [y/n]: " yn
        case $yn in
            [Yy]*) return 0 ;;
            [Nn]*) echo "Canceled" ; return 1 ;;
        esac
    done
}

if ! gm convert "$1" +dither -depth "${d_flag}" -colors "${c_flag}" "optimized-${1}" && ls -lh "$1" "optimized-${1}"; then
    echo "Failed to convert. Exiting."
    exit 1;
fi

new_size="$(stat -c '%s' "optimized-${1}")"
percent="$((( "${new_size}" * 100 / "$(stat -c '%s' "${1}" )" )))";
if (( "${percent}" > 75 )); then
    if yes_or_no "File is not much smaller (${percent}%). Remove optimized version?"; then
        rm "optimized-${1}";
    fi
else
    echo "New file `optimized-${1}` is $(((100 - "${percent}")))% smaller ($(numfmt --to=iec-i --suffix=B --format='%.2f' "${new_size}")).";
fi
