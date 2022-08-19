SRC = _config.yml $(shell find . -type f \( -iname '*.md' -o -iname '*.html' \) -not -path './_site/*')

all: build

build: _site/ _site_tor/ _site_ipfs/

serve:
	bundle exec jekyll serve -w -l --force_polling --drafts --config _config.yml,_config.local.yml

serve-prod:
	env JEKYLL_ENV=production bundle exec jekyll serve -w -l --force_polling --config _config.yml,_config.local.yml

_site/: ${SRC}
	env JEKYLL_ENV=production bundle exec jekyll build

_site_ipfs/: ${SRC}
	env JEKYLL_ENV=production bundle exec jekyll build --destination _site_ipfs/ --config _config.yml,_config.ipfs.yml

_site_tor/: ${SRC}
	env JEKYLL_ENV=production bundle exec jekyll build --destination _site_tor/ --config _config.yml,_config.tor.yml

publish: publish_online publish_tor publish_ipfs

publish_online: _site/
	rsync -icrz --delete _site/* sidneys1_sidneys1@ssh.phx.nearlyfreespeech.net:.

publish_tor: _site_tor/
	tar cz -C _site_tor . | ssh dell-laptop 'cat >_site_tor.tar.gz'
	ssh -t dell-laptop 'sudo tar xzf _site_tor.tar.gz -C /var/www/html/ && echo PUBLISHED TO TOR SUCCESSFULLY'

publish_ipfs: _site_ipfs/
	tar cz _site_ipfs | ssh ipfs@192.168.6.36 'cat >_site_ipfs.tar.gz'
	ssh -t ipfs@192.168.6.36 'tar xzf _site_ipfs.tar.gz && ipfs add -rQ _site_ipfs | xargs -I"!" ipfs name publish --key sidneys1.com "/ipfs/!" && echo PUBLISHED TO IPFS SUCCESSFULLY'

clean:
	rm -rf _site/
