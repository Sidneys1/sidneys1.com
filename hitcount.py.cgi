#!/usr/bin/env python3

import os
import json
from urllib.parse import parse_qsl

RET = """.hitcount {{
    display: grid !important;
}}

.hitcount-page::before {{
    content: '{}' !important;
}}

.hitcount-total::before {{
    content: '{}' !important;
}}"""

print("Content-Type: text/css\n\n")

try:
    path = '???'
    for k, v in parse_qsl(os.environ.get('QUERY_STRING')):
        if k == 'path':
            path = v

    hit_count_path = os.path.join(os.path.dirname(__file__), "writeable/hit-count.json")

    hit_counts = {}
    if os.path.isfile(hit_count_path):
        with open(hit_count_path) as fp:
            hit_counts = json.load(fp)

    if path not in hit_counts:
        hit_counts[path] = 0
    hit_counts[path] += 1

    with open(hit_count_path, 'w') as fp:
        json.dump(hit_counts, fp)

    total = '{:,}'.format(sum(hit_counts.values()))
    hits = '{:,}'.format(hit_counts[path])

    print(RET.format(hits, total))
except BaseException as e:
    print('Error!')
    print('<pre>', str(e), '</pre>')
