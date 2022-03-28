SRC = _config.yml $(shell find . -type f \( -iname '*.md' -o -iname '*.html' \) -not -path './_site/*')

all: build

build: _site/

serve:
	bundle exec jekyll serve -w -l --force_polling

_site/: ${SRC}
	env JEKYLL_ENV=production bundle exec jekyll build

publish: publish_online publish_tor

publish_online: _site/
	rsync -icrz --delete _site/* sidneys1_sidneys1@ssh.phx.nearlyfreespeech.net:.

publish_tor: _site/
	tar cz -C _site . | ssh dell-laptop 'cat >_site.tar.gz'
	ssh -t dell-laptop 'sudo tar xzf _site.tar.gz -C /var/www/html/ && echo done'