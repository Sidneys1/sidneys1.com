import requests
import indieweb_utils
import sys
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from pprint import pprint

ME = ("sidneys1.com", "sidneys1.github.io", "sidneys1-com.ipns.cf-ipfs.com", "preview.sidneys1.com", "sidneys77crlfslcr7zmj3msmxchgnxhrxlp3p3kbaswo7twchjnicid.onion")

def get_post_text(post):
    if post.get("story_text"):
        return post["story_text"]
    elif post.get("comment_text"):
        return post["comment_text"]
    else:
        return ""

def send_webmention(post_url, target_url):
    print(f"Found a link on Hacker News!")
    print("\tLink to post: " + post_url)
    print("\tLink to my website: " + target_url)

    try:
        return
        res = indieweb_utils.send_webmention(post_url, target_url)
        pprint(res)
    except indieweb_utils.webmentions.discovery.WebmentionEndpointNotFound:
        print("Webmention endpoint not found.")
        return
    except indieweb_utils.webmetions.send.GenericWebmentionError as ex:
        print(f"Failed to send webmention: {ex}")
        return

    print("Webmention sent!")

def process_comment():
    ...

def process_story():
    ...

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
            # pprint(post)
            # for comment_id in post.get('children', []):
            #     r2 = requests.get(f"https://hn.algolia.com/api/v1/items/{comment_id}")
            #     # print('CHILD: ', end='')
            #     comment = r2.json()
            #     # pprint(comment)
            #     if 'id' not in comment:
            #         continue
            #     send_webmention(f"https://news.ycombinator.com/item?id={comment['id']}", post_http_url)
            # continue
        # continue

        story_text = get_post_text(post)

        content = BeautifulSoup(story_text, "html.parser")

        links = content.find_all("a")

        for link in links:
            if link.get("href") is None:
                continue
            domain = urlparse(link.get("href")).netloc

            if domain == me:
                print('COMMENT:')
                print('\t', post_url, end='\n\t\t')
                pprint(link)
                print(end='\t\t')
                pprint(post)
                send_webmention(post_url, link.get("href"))
        print('.')

def main():
    for me in ME:
        print(f'Checking {me}...')
        process_site(me)

main()
