SRC := _config.yml $(shell find . -type f \( -iname '*.md' -o -iname '*.html' -o -iname '*.scss' -o -iname '*.cgi' -o -iname '*.xml' \) -not \( -path './_site*/*' -o -path './github_pages/*' \))
TIME:=$(shell date -Iminutes)

ONLINE_SSH_HOST:=sidneys1_sidneys1@ssh.nyc1.nearlyfreespeech.net
PREVIEW_SSH_HOST:=sidneys1@truenas.sidneys1.com
TOR_SSH_HOST:=192.168.6.36
IPFS_SSH_HOST:=192.168.6.160

.PHONY: all build serve serve-prod publish publish_online publish_tor publish_ipfs publish_github webmentions clean

all: build

build: _site/ _site_tor/ _site_ipfs/ _site_github/

serve:
	bundle exec jekyll serve -w -l --force_polling --drafts --destination _site_live/ --config _config.yml,_config.local.yml

serve-prod:
	env JEKYLL_ENV=production bundle exec jekyll serve -w -l --force_polling --destination _site_live/ --config _config.yml,_config.local.yml,_config.local-prod.yml

_site/: ${SRC}
	env JEKYLL_ENV=production bundle exec jekyll build --incremental

_site_%/: ${SRC}
	env JEKYLL_ENV=production bundle exec jekyll build --incremental --destination _site_$*/ --config _config.yml,_config.$*.yml

_site_preview/: ${SRC}
	env JEKYLL_ENV=production bundle exec jekyll build --drafts --incremental --destination _site_preview/ --config _config.yml,_config.preview.yml

publish: publish_online publish_tor publish_github publish_ipfs publish_preview

publish_online: _site/
	rsync -icrz --delete --exclude writeable/ _site/* ${ONLINE_SSH_HOST}:.
#	ssh ${ONLINE_SSH_HOST} 'mkdir -p ./writeable/ && chgrp web ./writeable/ && chmod g+w ./writeable/'

publish_preview: _site_preview/
	rsync -icrzp --chown 568:568 --delete --exclude writeable/ _site_preview/* "${PREVIEW_SSH_HOST}:/mnt/Bulk Storage/docker/data/preview.sidneys1.com/www/"

publish_tor: _site_tor/
	tar cz -C _site_tor . | ssh ${TOR_SSH_HOST} 'cat | sudo tar xz -C /var/www/html/ && echo PUBLISHED TO TOR SUCCESSFULLY'

publish_ipfs: _site_ipfs/
	tar cz _site_ipfs | ssh ipfs@${IPFS_SSH_HOST} 'cat | tar xz && ipfs add -rQ _site_ipfs | xargs -I"!" ipfs name publish --key sidneys1.com "/ipfs/!" && echo PUBLISHED TO IPFS SUCCESSFULLY'

publish_github: _site_github/
	rsync -icr --delete _site_github/* github_pages/
	cd github_pages && git add -A && git commit -m "Updated website at ${TIME}" && git.exe push
	git add github_pages
	git commit -m 'Updated github pages'

webmentions:
	bundle exec jekyll webmention

clean:
	rm -rf _site/ _site_github/ _site_ipfs/ _site_tor/ _site_live/ _site_preview/
	cd github_pages && git reset --hard HEAD
