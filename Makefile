export
CC		:= musl-gcc # note: 9base overrides (musl breaks some commands)
LDFLAGS		:= -static
OBJTYPE		:= x86_64
PREFIX		:= $(dir $(realpath $(firstword $(MAKEFILE_LIST))))
MANPREFIX	:= $(PREFIX)/man
PLAN9		:= $(PREFIX)/vendor/9base
YACC		:= $(PREFIX)/vendor/9base/yacc/yacc -S
EDIT		:= null

.PHONY: all deps kwerc 9base es mawk jq cgd bat redli clean

all: deps kwerc

deps: 9base es mawk jq cgd bat redli

kwerc: espath chmod

9base:
	$(MAKE) -C vendor/9base CC=cc LDFLAGS=$(LDFLAGS) OBJTYPE=$(OBJTYPE) PREFIX=$(PREFIX) MANPREFIX=$(MANPREFIX) install

es: 9base
	cd vendor/es && ./configure --bindir=$(PREFIX)/bin --mandir=$(MANPREFIX)
	$(MAKE) -C vendor/es install

mawk:
	touch vendor/mawk/array.c vendor/mawk/array.h vendor/mawk/parse.c vendor/mawk/parse.h
	cd vendor/mawk && ./configure --prefix=$(PREFIX) --mandir=$(MANPREFIX)
	$(MAKE) -C vendor/mawk install

jq:
	cd vendor/jq && ./configure --prefix=$(PREFIX) --mandir=$(MANPREFIX) --with-oniguruma=builtin --disable-maintainer-mode --enable-all-static
	$(MAKE) -C vendor/jq
	mkdir -p $(PREFIX)/bin && cp vendor/jq/jq $(PREFIX)/bin/
	mkdir -p $(PREFIX)/man/man1 && cp vendor/jq/jq.1 $(PREFIX)/man/man1/

cgd:
	cd vendor/cgd && go build -ldflags "-linkmode external -extldflags -static"
	mkdir -p $(PREFIX)/bin && cp vendor/cgd/cgd $(PREFIX)/bin/

bat:
	cd vendor/bat && go build -ldflags "-linkmode external -extldflags -static"
	mkdir -p $(PREFIX)/bin && cp vendor/bat/bat $(PREFIX)/bin/

redli:
	cd vendor/redli && go build -ldflags "-linkmode external -extldflags -static"
	mkdir -p $(PREFIX)/bin && cp vendor/redli/redli $(PREFIX)/bin/

espath:
	sed '1c#!'$(PREFIX)'bin/es' $(PREFIX)/es/kwerc.es > $(PREFIX)/es/kwerc.es.tmp
	mv $(PREFIX)/es/kwerc.es.tmp $(PREFIX)/es/kwerc.es

chmod:
	chmod u+x $(PREFIX)/es/kwerc.es
	chmod go-rwx $(PREFIX)/config.example

clean:
	$(MAKE) -C vendor/9base PREFIX=$(PREFIX) MANPREFIX=$(MANPREFIX) uninstall clean
	rm $(PREFIX)/bin/es $(PREFIX)/bin/esdebug $(MANPREFIX)/man1/es.1
	$(MAKE) -C vendor/es PREFIX=$(PREFIX) MANPREFIX=$(MANPREFIX) clean
	$(MAKE) -C vendor/mawk uninstall clean
	rm $(PREFIX)/bin/jq $(MANPREFIX)/man1/jq.1
	$(MAKE) -C vendor/jq clean
	rm $(PREFIX)/bin/cgd; cd vendor/cgd && go clean
	rm $(PREFIX)/bin/bat; cd vendor/bat && go clean
	rm $(PREFIX)/bin/redli; cd vendor/redli && go clean
	sed '1c#!/path/to/kwerc/bin/es' $(PREFIX)/es/kwerc.es > $(PREFIX)/es/kwerc.es.tmp
	mv $(PREFIX)/es/kwerc.es.tmp $(PREFIX)/es/kwerc.es
