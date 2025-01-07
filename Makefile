SRC := _config.yml $(shell find . -type f \( -iname '*.md' -o -iname '*.html' -o -iname '*.scss' -o -iname '*.cgi' -o -iname '*.xml' \) -not \( -path './_site*/*' -o -path './github_pages/*' \))
TIME:=$(shell date -Iminutes)

ONLINE_SSH_HOST:=sidneys1_sidneys1@ssh.nyc1.nearlyfreespeech.net
PREVIEW_SSH_HOST:=sidneys1@truenas.sidneys1.com
TOR_SSH_HOST:=192.168.6.36
IPFS_SSH_HOST:=192.168.6.160

.PHONY: all build serve serve-prod publish publish_online publish_tor publish_ipfs publish_github webmentions clean

all: build

build: .site/ .site_tor/ .site_ipfs/ .site_github/

serve:
	bundle exec jekyll serve -w -l --force_polling --drafts --destination .site_live/ --config _config.yml,_config.local.yml

serve-prod:
	env JEKYLL_ENV=production bundle exec jekyll serve -w -l --force_polling --destination .site_live/ --config _config.yml,_config.local.yml,_config.local-prod.yml

.site/: ${SRC}
	env JEKYLL_ENV=production bundle exec jekyll build --incremental --destination $@

.site_%/: ${SRC}
	env JEKYLL_ENV=production bundle exec jekyll build --incremental --destination $@/ --config _config.yml,_config.$*.yml

_site_preview/: ${SRC}
	env JEKYLL_ENV=production bundle exec jekyll build --drafts --incremental --destination _site_preview/ --config _config.yml,_config.preview.yml

publish: publish_online publish_tor publish_github publish_ipfs publish_preview

publish_online: .site/
	rsync -icrz --delete --exclude writeable/ .site/* ${ONLINE_SSH_HOST}:.
#	ssh ${ONLINE_SSH_HOST} 'mkdir -p ./writeable/ && chgrp web ./writeable/ && chmod g+w ./writeable/'

publish_preview: .site_preview/
	rsync -icrzp --chown 568:568 --delete --exclude writeable/ .site_preview/* "${PREVIEW_SSH_HOST}:/mnt/Bulk Storage/docker/data/preview.sidneys1.com/www/"

publish_tor: .site_tor/
	tar cz -C $^ | ssh ${TOR_SSH_HOST} 'cat | sudo tar xz -C /var/www/html/ && echo PUBLISHED TO TOR SUCCESSFULLY'

publish_ipfs: .site_ipfs/
	tar cz $^ | ssh ipfs@${IPFS_SSH_HOST} 'cat | tar xz && ipfs add -rQ $^ | xargs -I"!" ipfs name publish --key sidneys1.com "/ipfs/!" && echo PUBLISHED TO IPFS SUCCESSFULLY'

publish_github: .site_github/
	rsync -icr --delete .site_github/* github_pages/
	cd github_pages && git add -A && git commit -m "Updated website at ${TIME}" && git.exe push
	git add github_pages
	git commit -m 'Updated github pages'

webmentions:
	python3 hn.py
	bundle exec jekyll webmention

clean:
	rm -rf .site/ .site_github/ .site_ipfs/ .site_tor/ .site_live/ .site_preview/
	cd github_pages && git reset --hard HEAD
