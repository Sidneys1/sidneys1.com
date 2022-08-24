---
layout: post
title:  "How I Built This Website, And How to Do It Yourself"
subtitle: Static Websites with Jekyll
categories: [programming]
# date:   2022-03-24 13:04:39 -0400
tags: [programming, meta]
# series: "Selectric Repair"
author: Sidneys1
image: /images/how-I-built-this-website/hero.png
image_shadow: false
toc: false
excerpt_separator: <!--more-->
multipart: building-this-website
erratum:
- "2022-08-24: Added section on modifying the Jekyll configuration."
---

Sidneys1.com is built statically using [Jekyll](https://jekyllrb.com/), and then published on the world wide web, Tor,
and IPFS. How is this all accomplished, and how can you host your own website this way? Let's walk through it step by
step. We'll be looking into (over the course of several posts):

* Building a website with Jekyll
* Hosting on NearlyFreeSpeech.net
* Customizing the site layout and adding useful features
* Hosting on IPFS
* Hosting on Tor

<!--more-->

## Getting Started With Jekyll

I use a Windows PC, and I find that the Jekyll environment is easier to set up under the
[Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/about), so that's what I'll be using going
forward in this post. First, we'll install Ruby via your package manager - Ubuntu 20.04 has Ruby 2.7 available on apt
via `apt install ruby`. Next we'll use the Ruby package manager, `gem` to install both Jekyll and Bundler:
`gem install bundler jekyll`. Finally, you can create a new Jekyll site with `jekyll new sitename`.

Once inside the new site folder, you can generate and serve your page with `bundle exec jekyll serve`! This will create
a development server on `http://localhost:4000`. Let's quickly talk about how Jekyll works:

1. You create Markdown or HTML files in your site's folder for each post you wish to make.
2. Jekyll processes these files (along with some templates - we'll get to these later) to generate static HTML files.
3. These static HTML files (in `_site`) are what you want to put on your web hosting! It's all static, so you don't need
   anything fancy like server-side PHP or client-side Angular or React.

To simplify the build-preview and build-release process, let's make a simple Makefile. GNU Make is a tool that allows
you to define simple build steps, and then figures out the interdependencies between these steps for you. Let's take
a look:

```make
all: build

build: _site/

serve:
	bundle exec jekyll serve --watch --livereload --force_polling --drafts --destination _site_live/

_site/:
	env JEKYLL_ENV=production bundle exec jekyll build

clean:
	rm -rf _site/
```

Let's break down each of these sections:
* `all: build`: "all" is the default rule run when you execute `make`. This line says when "all" is run, run "build"
  first.
* `build: _site/`: when the "build" rule is run, we depend on "_site/" being built first.
* `serve: ...`: If you execute `make serve`, this rule is triggered. Make will run the `bundle exec jekyll serve ...`
  command we've listed. The parameters included are:
  * `--watch`: live-rebuild any changes made to the posts as you edit them (very useful!).
  * `--livereload`: use LiveReload to automatically refresh your browser when changes are rebuilt.
  * `--force_polling`: this is a workaround for some WSL bugs. See
    [this WSL issue](https://github.com/Microsoft/BashOnWindows/issues/216).
  * `--drafts`: include posts under the `_drafts` folder (this is where you can put in-progress posts).
  * `--destination _site_live/`: this directs the `serve` command to build the static output under a separate folder
    than the normal `_site/` rule. This way we can't accidentally publish our live preview version of the website - if
    we did, it would be broken because all links would lead to `localhost` instead of your website's URL!
* `_site/: ...`: this rule matches a file path, `_site`, which is Jekyll's output folder. Make understands file paths
  and will know that this rule will build the contents of `_site`. Note that we use `env` to tell Jekyll to use the
  ["production" environment](https://jekyllrb.com/docs/configuration/environments/).

  We'll never run this rule manually (though you could with `make _site/`), but our `build` rule depends on this
  running, and so Make will automatically run it when needed.
* `clean: ...`: Run `make clean` to invoke this rule - in our case, we just delete the `_site/` folder.

## Modifying the Jekyll Configuration

Jekyll configuration is stored in the `_config.yml` file at the root of our site. There are a couple things in here
we'll want to adjust before we publish our site to the world wide web. First of course we'll want to set a few basics:

* `title`: The name of your site (shown in the header).
* `email`: A contact email address (shown in the footer).
* `url`: This one is important - this sets the url used when clicking on absolute links to other pages within your site!
* `baseurl`: Used in conjunction with `url`. The format used is `{url}{baseurl}/path/to/page.html`. If you're hosting
  nothing but Jekyll on your website, then leave this blank.

And that's about it! We'll dig into configuration more when we talk about hosting on Tor and IPFS.

## Hosting

Ok! Now that we have a (basic) site, how do we host it? Let's start simple and look at NearlyFreeSpeech.net, whom I've
been using for years. They're cheap, no-nonsense, and don't have any crazy hidden fees. They also have support for Let's
Encrypt certificates, making SSL support both easy and automatic. Head on over and set up an account. It'll walk you
through creating a site (your website hosting) and you can even register and connect the domain name all within their
system. Eventually you'll find the settings to be able to connect with SSH - enable this and let's update our Makefile
again. Add this rule to your Makefile:

```make
publish: _site/
	rsync --itemize-changes --checksum --recursive --compress --delete _site/* $USER@ssh.phx.nearlyfreespeech.net:.
```

Let's break it down again:
* `publish: _site/`: when we execute `make publish`, we want to make sure the rule to build the `_site/` folder runs
  first.
* `rsync [...] _site/* $USER@ssh.phx.nearlyfreespeech.net:.`: we'll use rsync (a remote file-copying tool) to connect to
  our hosting via SSH, synchronizing the contents of `_site` with the root (`.`) folder of our hosting. You'll want to
  replace `$USER` with your NearlyFreeSpeech.net username, of course.

  The options we're using are:
  * `--itemize-changes`: list changes as we go (for clarity).
  * `--checksum`: rely on a file checksum (not timestamps and file size) to determine if files need to be replaced.
  * `--recursive`: recurse into subdirectories of `_site/`.
  * `--compress`: HTML is very compressible, so why not save some bandwidth?
  * `--delete`: this allows rsync to remove files on your hosting that are no longer present in your `_site` folder.
    This can be useful if you rename or delete a file that you no longer want people to be able to access.

Running `make publish` now should build your website and then prompt your for your NearlyFreeSpeech.net password to
connect with SSH. Provide your password and watch as your site is made available!

## Up Next

In future posts in this series, we'll look at making some quality of life improvements to the default Jekyll layout and
theme, as well as hosting our site on IPFS!
