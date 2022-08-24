SRC = _config.yml $(shell find . -type f \( -iname '*.md' -o -iname '*.html' -o -iname '*.scss' \) -not -path './_site*/*')
TIME=$(shell date -Iminutes)

all: build

build: _site/ _site_tor/ _site_ipfs/ _site_github/

serve:
	bundle exec jekyll serve -w -l --force_polling --drafts --destination _site_live/ --config _config.yml,_config.local.yml

serve-prod:
	env JEKYLL_ENV=production bundle exec jekyll serve -w -l --force_polling --destination _site_live/ --config _config.yml,_config.local.yml

_site/: ${SRC}
	env JEKYLL_ENV=production bundle exec jekyll build --incremental

_site_%/: ${SRC}
	env JEKYLL_ENV=production bundle exec jekyll build --incremental --destination _site_$*/ --config _config.yml,_config.$*.yml

publish: publish_online publish_tor publish_github publish_ipfs

publish_online: _site/
	rsync -icrz --delete _site/* sidneys1_sidneys1@ssh.phx.nearlyfreespeech.net:.

publish_tor: _site_tor/
	tar cz -C _site_tor . | ssh dell-laptop 'cat | sudo tar xz -C /var/www/html/ && echo PUBLISHED TO TOR SUCCESSFULLY'

publish_ipfs: _site_ipfs/
	tar cz _site_ipfs | ssh ipfs@192.168.6.36 'cat | tar xz && ipfs add -rQ _site_ipfs | xargs -I"!" ipfs name publish --key sidneys1.com "/ipfs/!" && echo PUBLISHED TO IPFS SUCCESSFULLY'

publish_github: _site_github/
	rsync -icr --delete _site_github/* github_pages/
	cd github_pages && git add -A && git commit -m "Updated website at ${TIME}" && git push
	git add github_pages
	git commit -m 'Updated github pages'

clean:
	rm -rf _site/ _site_github/ _site_ipfs/ _site_tor/ _site_live/
	cd github_pages && git reset --hard HEAD
