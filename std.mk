# std.mk - included by most Makefiles in subdirs

OFILES    ?= ${TARG}.o
MANFILE   ?= ${TARG}.1

include ../config.mk

all: ${TARG}
#	@strip ${TARG}
	@echo built ${TARG}

install: install-default post-install

install-default: ${TARG}
	@mkdir -p ${DESTDIR}${PREFIX}/bin
	@cp -f ${TARG} ${DESTDIR}${PREFIX}/bin/
	@chmod 755 ${DESTDIR}${PREFIX}/bin/${TARG}
	@mkdir -p ${DESTDIR}${MANPREFIX}/man1
	@cp -f ${MANFILE} ${DESTDIR}${MANPREFIX}/man1
	@chmod 444 ${DESTDIR}${MANPREFIX}/man1/${MANFILE}

uninstall: pre-uninstall
	rm -f ${DESTDIR}${PREFIX}/bin/${TARG}
	rm -f ${DESTDIR}${MANPREFIX}/man1/${MANFILE}

.c.o:
	@echo CC $*.c
	@${CC} ${CFLAGS} -I../lib9 -I../lib9/sec $*.c

clean:
	rm -f ${OFILES} ${TARG}

${TARG}: ${OFILES}
	@echo LD ${TARG}
	@${CC} ${LDFLAGS} -o ${TARG} ${OFILES} -L../lib9 -l9 -lm
	@chmod 755 ${TARG}
