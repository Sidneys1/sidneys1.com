#!/usr/bin/env python3
"""
Send Webmentions for Hacker News stories and comments.
Webmention: https://www.w3.org/TR/webmention/
Dependencies:
- python3 -m pip install indieweb_utils BeautifulSoup4
"""
import requests
import indieweb_utils
import sys
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from pprint import pprint

# Replace with your Webmention domains.
# The indieweb_utils package will attempt resolve the appropriate Webmention server automatically.
SITES = (
    "sidneys1.com",
    "sidneys1.github.io",
    "sidneys1-com.ipns.cf-ipfs.com",
    "preview.sidneys1.com",
    "sidneys77crlfslcr7zmj3msmxchgnxhrxlp3p3kbaswo7twchjnicid.onion"
)

def get_post_text(post):
    if post.get("story_text"):
        return post["story_text"]
    elif post.get("comment_text"):
        return post["comment_text"]
    else:
        return ""

def send_webmention(post_url, target_url):
    print(f"Found a link on Hacker News: `{post_url}` links to `{target_url}`.")

    try:
        print("Sending... ", end='', flush=True)
        rs = indieweb_utils.send_webmention(post_url, target_url)
        pprint(rs)
        print("Done.")
    except indieweb_utils.webmentions.discovery.WebmentionEndpointNotFound:
        print("Webmention endpoint not found.")
        return
    except indieweb_utils.webmentions.send.GenericWebmentionError as ex:
        print(f"Failed to send webmention: {ex}")
        pprint(ex.__dict__)
        return

    print("Webmention sent!")

def process_site(me):
    try:
        r = requests.get(f"https://hn.algolia.com/api/v1/search?query={me}")
    except requests.exceptions.RequestException as e:
        print(f"Failed to query HackerNews API for `{me}`: {e}")
        return

    hn_posts = r.json()["hits"]

    for post in hn_posts:
        # pprint(post)
        post_url = "https://news.ycombinator.com/item?id=" + str(post["objectID"])

        if post.get('author') == 'Sidneys1':
            continue

        post_http_url = post.get("url")

        if post_http_url is not None and urlparse(post_http_url).netloc == me:
            send_webmention(post_url, post_http_url)
            ## Commented out: comments that don't directly link to my page don't seem to work.
            # pprint(post)
            # for comment_id in post.get('children', []):
            #     r2 = requests.get(f"https://hn.algolia.com/api/v1/items/{comment_id}")
            #     comment = r2.json()
            #     if 'id' not in comment:
            #         continue
            #     send_webmention(f"https://news.ycombinator.com/item?id={comment['id']}", post_http_url)

        for link in BeautifulSoup(get_post_text(post), "html.parser").find_all("a"):
            if link.get("href") is None:
                continue
            domain = urlparse(link.get("href")).netloc

            if domain == me:
                send_webmention(post_url, link.get("href"))

def main():
    for me in SITES:
        print(f'Checking {me}...')
        process_site(me)

main()
