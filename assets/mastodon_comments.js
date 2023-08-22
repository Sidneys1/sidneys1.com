/*
  Mastodon comment integration code by Julian Fietkau, 2023.

  Closely inspired by:
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

  function renderComment(comment, firstMentionFilter) {
    let result = document.querySelector('section#comments template').content.cloneNode(true);
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
    for(let number of ['favourites', 'reblogs']) {
      if(comment[number + '_count'] > 0) {
        let tidbit = document.createElement('span');
        tidbit.classList.add(number);
        let symbol = document.createElement('span');
        if(number == 'favourites') {
          symbol.innerText = '♥️';
        } else {
          symbol.innerText = '🔁';
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

  function renderComments(comments, firstMentionFilter) {
    comments.sort((a, b) => a['created_at'] > b['created_at']);
    let result = document.createElement('ol');
    result.classList.add('comments');
    for(let i = 0; i < comments.length; i++) {
      let container = document.createElement('li');
      container.appendChild(renderComment(comments[i], firstMentionFilter));
      if(comments[i]['children'].length > 0) {
        container.appendChild(renderComments(comments[i]['children'], [comments[i]['account']['url']]));
      }
      result.appendChild(container);
    }
    return result;
  }

  function showComments(comments) {
    let commentsElem = document.querySelector('section#comments');
    let contentElem = commentsElem.querySelector('.placeholder');
    if(comments.length == 0) {
      contentElem.classList.remove('placeholder');
      contentElem.classList.add("disabled");
      contentElem.innerText = 'No comments so far.';
      return;
    }
    // List of mentions that should be stripped if a top-level comment starts with one of them.
    // Insert your fedi ID here!
    let defaultInitialMentionFilter = ['https://infosec.exchange/@Sidneys1'];
    let result = renderComments(comments, defaultInitialMentionFilter);
    commentsElem.insertBefore(result, contentElem);
    contentElem.remove();
  }

  function loadComments(url) {
    let rootId = url.split('/')[6];
    fetch(url).then((response) => {
      return response.json();
    }).then((data) => {
      let comments = [];
      console.debug(data);
      if(data['descendants'] && Array.isArray(data['descendants'])) {
        let tempDict = {};
        data['descendants'].forEach((comment) => {
          if(comment['visibility'] != 'public') return;
          comment['children'] = [];
          if(comment['in_reply_to_id'] == rootId) {
            comments.push(comment);
          } else {
            tempDict[comment['in_reply_to_id']].children.push(comment);
          }
          tempDict[comment['id']] = comment;
        });
      }
      showComments(comments);
    }).catch((err) => {
      console.error(err);
      document.querySelector('section#comments .placeholder').innerText = 'Could not load comments because of: ' + err.message;
    });
  }

  function loadContext(url) {
    fetch(url).then((response) => {
      return response.json();
    }).then((data) => {
      console.debug(data);
      let addto = document.querySelector("#stats")
      for(let number of ['favourites', 'reblogs']) {
        let num = data[number + '_count'];
        if(num > 0) {
          let tidbit = document.createElement('span');
          tidbit.classList.add(number);
          let symbol = document.createElement('span');
          if(number == 'favourites') {
            symbol.innerText = '♥️';
            tidbit.title = `${num.toLocaleString()} Favorite${num == 1 ? '' : 's'}`;
          } else {
            symbol.innerText = '🔁';
            tidbit.title = `${num.toLocaleString()} Boost${num == 1 ? '' : 's'}`;
          }
          tidbit.appendChild(symbol);
          let count = document.createElement('span');
          count.innerText = num.toLocaleString();
          tidbit.appendChild(count);
          addto.appendChild(tidbit);
        }
      }
    }).catch(console.error);
  }

  function initComments() {
    let commentsElem = document.querySelector('section#comments');
    if(!commentsElem) return;
    let url = commentsElem.dataset.url;
    if (!url) return;
    let placeholder = document.createElement('p');
    placeholder.classList.add('placeholder');
    placeholder.classList.add('disabled');
    placeholder.innerText = 'Comments are being loaded…';
    commentsElem.insertBefore(placeholder, document.querySelector("#comment-credit"));
    let urlParts = url.split('/');
    loadComments(`https://${urlParts[2]}/api/v1/statuses/${urlParts[4]}/context`);
    loadContext(`https://${urlParts[2]}/api/v1/statuses/${urlParts[4]}`)
  }
