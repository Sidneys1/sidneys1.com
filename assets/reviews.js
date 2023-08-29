/*
  Mastodon comment integration code by Sidneys1, 2023.

  Closely inspired by:
  Julian Fietkau - https://fietkau.social/@julian
  Jan Wildeboer - https://jan.wildeboer.net/2023/02/Jekyll-Mastodon-Comments/
  Cassidy Blaede - https://mastodon.blaede.family/@cassidy/110623574992080570

  This is just the JavaScript code, you'll need to supply your own HTML
  container (including a template for comment rendering) and CSS.

  Released under the terms of the MIT license.
*/

  function formatIsoDate(isoDate) {
    return new Date(Date.UTC(
      parseInt(isoDate.slice(0, 4), 10),
      parseInt(isoDate.slice(5, 7), 10) - 1,
      parseInt(isoDate.slice(8, 10), 10),
      parseInt(isoDate.slice(11, 13), 10),
      parseInt(isoDate.slice(14, 16), 10),
      parseInt(isoDate.slice(17,19), 10)
    )).toLocaleDateString('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  }

  function renderComment(comment, firstMentionFilter, commentsElem, hasFollowOn) {
    let result = commentsElem.querySelector('template').content.cloneNode(true);
    result.querySelector('img.avatar').src = comment['account']['avatar_static'];
    result.querySelector('img.avatar').alt = comment['account']['display_name'] + '\'s avatar';
    result.querySelector('a.user').href = comment['account']['url'];
    let displayName = result.querySelector('.displayname');
    displayName.innerText = comment['account']['display_name'];
    comment['account']['emojis'].forEach((emoji) => {
      displayName.innerHTML = displayName.innerHTML.replace(':' + emoji['shortcode'] + ':', '<picture class="emoji"><source srcset="' + emoji['url'] + '" media="(prefers-reduced-motion: no-preference)"><img src="' + emoji['static_url'] + '" alt=":' + emoji['shortcode'] + ':" title=":' + emoji['shortcode'] + ':"></picture>');
    });
    if(result.querySelector('.displayname').innerText.length == 0) {
      result.querySelector('.displayname').innerText = comment['account']['username'];
    }
    let account = comment['account']['acct'];
    if(account.indexOf('@') == -1) {
      account = account + '@' + comment['account']['url'].split('/')[2];
    }
    let timestampElem = result.querySelector('.timestamp');
    timestampElem.innerText = formatIsoDate(comment['created_at']);
    let linkElem = result.querySelector('a.link');
    linkElem.setAttribute('title', "See this comment on Mastodon.");
    if(comment['edited_at']) {
      let edited = document.createElement('span');
      edited.innerText = '*';
      edited.setAttribute('title', 'Last edited: ' + formatIsoDate(comment['edited_at']));
      timestampElem.innerText += ' ';
      timestampElem.appendChild(edited);
      linkElem.setAttribute("title", "See this comment on Mastodon. Last edited: " + formatIsoDate(comment['edited_at']));
    }
    result.querySelector('.handle').innerText = '@' + account;
    let spoilerElem = result.querySelector('.spoiler');
    if (comment['spoiler_text']) {
      spoilerElem.innerText = "⚠️ " + comment['spoiler_text'];
    } else {
      spoilerElem.remove();
    }
    let contentElem = result.querySelector('.content');
    contentElem.innerHTML = comment['content'];
    let firstMention = result.querySelector('.content .mention');
    if(firstMention && firstMentionFilter.includes(firstMention.href) && firstMention.parentNode == firstMention.parentNode.parentNode.firstChild) {
      let removalCandidate = firstMention;
      while((removalCandidate == firstMention || removalCandidate.childNodes.length == 0) && removalCandidate != result.querySelector('.content')) {
        let next = removalCandidate.parentNode;
        removalCandidate.remove();
        removalCandidate = next;
      }
    }
    comment['emojis'].forEach((emoji) => {
      contentElem.innerHTML = contentElem.innerHTML.replace(':' + emoji['shortcode'] + ':', '<picture class="emoji"><source srcset="' + emoji['url'] + '" media="(prefers-reduced-motion: no-preference)"><img src="' + emoji['static_url'] + '" alt=":' + emoji['shortcode'] + ':" title=":' + emoji['shortcode'] + ':"></picture>');
    });
    linkElem.href = comment['url'];
    for(let number of ['favourites', 'reblogs', 'replies']) {
      if(comment[number + '_count'] > 0) {
        if (hasFollowOn && number === 'replies' && comment[number + '_count'] === 1) continue;
        let tidbit = document.createElement('span');
        tidbit.setAttribute('title', `${comment[number + '_count'].toLocaleString()} ${number.substring(0, 1).toUpperCase()}${number.substring(1)}`)
        tidbit.classList.add(number);
        let symbol = document.createElement('span');
        if(number == 'favourites') {
          symbol.innerText = '♥️';
        } else if (number == 'reblogs') {
          symbol.innerText = '🔁';
        } else if (number == 'replies') {
          symbol.innerText = '💬';
        }
        tidbit.appendChild(symbol);
        let count = document.createElement('span');
        count.innerText = comment[number + '_count'];
        tidbit.appendChild(count);
        result.querySelector('.tidbits').appendChild(tidbit);
      }
    }
    return result;
  }

  function renderComments(comments, notes, firstMentionFilter, commentsElem) {
    comments.sort((a, b) => a['created_at'] > b['created_at']);
    let result = document.createElement('ol');
    result.classList.add('comments');
    for(let i = 0; i < comments.length; i++) {
      let noteContent = {};
      if (comments[i]["id"] in notes) {
        noteContent = notes[comments[i]["id"]]
      }
      if ('before' in noteContent) {
        let note = document.createElement('li');
        note.classList.add("note");
        note.innerHTML = `<span>${noteContent['before']}</span>`;
        result.appendChild(note);
      }
      let container = document.createElement('li');
      const hasFollowOn = (i + 1) < comments.length && comments[i+1]['in_reply_to_id'] === comments[i]['id'];
      if (!hasFollowOn) {
        container.classList.add("no-reply");
      }
      const isFollowOn = i > 0 && comments[i]['in_reply_to_id'] === comments[i-1]['id'];
      if (isFollowOn) {
        container.classList.add('is-reply');
      }
      container.appendChild(renderComment(comments[i], firstMentionFilter, commentsElem, hasFollowOn));
      result.appendChild(container);
      if ('after' in noteContent) {
        let note = document.createElement('li');
        note.classList.add("note");
        note.innerHTML = `<span>${noteContent['after']}</span>`;
        result.appendChild(note);
      } else if (typeof noteContent === 'string' || noteContent instanceof String) {
        let note = document.createElement('li');
        note.classList.add("note");
        note.innerHTML = `<span>${noteContent}</span>`;
        result.appendChild(note);
      }
    }
    return result;
  }

  function showComments(comments, notes, commentsElem) {
    // let contentElem = commentsElem.querySelector('.placeholder');
    // if(comments.length == 0) {
    //   contentElem.classList.remove('placeholder');
    //   contentElem.classList.add("disabled");
    //   contentElem.innerText = 'No comments so far.';
    //   return;
    // }
    // List of mentions that should be stripped if a top-level comment starts with one of them.
    // Insert your fedi ID here!
    let defaultInitialMentionFilter = ['https://infosec.exchange/@Sidneys1'];
    let result = renderComments(comments, notes, defaultInitialMentionFilter, commentsElem);
    commentsElem.appendChild(result);
    // contentElem.remove();
  }

  function parseLinkHeader(data) {
    let arrData = data.split("link:")
    data = arrData.length == 2? arrData[1]: data;
    let parsed_data = {}

    arrData = data.split(",")

    for (d of arrData){
        linkInfo = /<([^>]+)>;\s+rel="([^"]+)"/ig.exec(d)

        parsed_data[linkInfo[2]]=linkInfo[1]
    }

    return parsed_data;
  }

  /**
   *
   * @param {string[]} urls
   * @param {*} notes
   * @param {HTMLElement} element
   * @param {string[]} exclude
   */
  function loadComments(urls, notes, element, exclude) {
    /** @type {Promise<any[]>[]} */
    const promises = [];
    for (const url of urls) {
      promises.push(fetch(url).then((response) => {
        const linkHeader = response.headers.get("Link");
        if (linkHeader) {
          console.debug(parseLinkHeader(linkHeader));
        }
        return response.json();
      }).then((data) => {
        const urlParts = url.split("/");
        console.log(urlParts);
        if (urlParts[5] === "statuses") {
          if (url.endsWith("/context")) {
            // console.log(`Got ${data['descendants'].length} toots from ${url}: `, data);
            return data['descendants'].filter(c => c['account']['id'] === '109322148624806846' && !exclude.includes(c['id']));
          } else {
            // console.log(`Got single toot from ${url}: `, data);
            return [data].filter(c => c['account']['id'] === '109322148624806846' && !exclude.includes(c['id']));
          }
        } else {
          // console.log(`Got ${data.length} toots from ${url}: `, data);
          return data.filter(c => c['account']['id'] === '109322148624806846' && !exclude.includes(c['id']));
          // showComments(data.filter(c =>!exclude.includes(c['id'])), notes, element);
        }
        return [{}];
      }).catch((err) => {
        console.error(err);
        let placeholder = document.createElement('p');
        placeholder.classList.add('placeholder');
        placeholder.classList.add('disabled');
        placeholder.innerText = 'Could not load comments because of: ' + err.message;
        element.appendChild(placeholder);
        return [];
      }));
    }
    Promise.all(promises).then(values => {
      const uniqIds = new Set();
      const uniqComments = values.flat().filter(entry => {
        if (uniqIds.has(entry['id'])) return false;
        uniqIds.add(entry["id"]);
        return true;
      }).sort((a, b) => a['id'] > b['id'])
      console.debug(uniqComments);
      showComments(uniqComments, notes, element);
    });
  }

  function init() {
    let dynamicContent = document.querySelector("section#dynamic_content");
    let mastodonReviewElements = document.querySelectorAll('section.mastodon-thread');
    if(!mastodonReviewElements) return;
    let placeholder = document.createElement('p');
    placeholder.classList.add('placeholder');
    placeholder.classList.add('disabled');
    placeholder.innerText = 'Review content is being loaded…';
    dynamicContent.appendChild(placeholder);
    try {
      for (const e of mastodonReviewElements) {
        let url = JSON.parse(e.dataset.url);
        if (!url) continue;
        if (url instanceof String)
          url = [url];
        let exclude = e.dataset.exclude.split(';');
        const notes = JSON.parse(e.dataset.notes) || {};
        loadComments(url, notes, e, exclude);
      }
    } finally {
        placeholder.remove();
    }
    // loadContext(`https://${urlParts[2]}/api/v1/statuses/${urlParts[4]}`)
  }
