SRC = _config.yml $(shell find . -type f \( -iname '*.md' -o -iname '*.html' \) -not -path './_site/*')

all: build

build: _site/

serve:
	bundle exec jekyll serve -w -l --force_polling

_site/: ${SRC}
	bundle exec jekyll build

publish: _site/
	rsync -icrz --delete _site/* sidneys1_sidneys1@ssh.phx.nearlyfreespeech.net:.