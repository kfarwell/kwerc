kwerc
=====

Welcome to kyle's werc, a reimagination of Uriel's
[werc](http://werc.cat-v.org/) web framework written in
[es shell](https://wryun.github.io/es-shell/).

Features
--------

* Productive. Build powerful, scalable web apps as easily as writing
  shell scripts. Literally -- es is shell! Pipe together Unix tools like
  sed and grep or virtually any command line programs to build complex
  functions with very little code. And with far more intelligent design
  than Bourne/bash and other shells, es is fun and reliable.
* Easy to learn. Don't know es? No problem (almost no one does). Es is
  extremely simple. If you know Bourne shell or bash or rc, you already
  know most of es. Check out the
  [es paper](https://wryun.github.io/es-shell/paper.html) for a complete
  description of the language in just 10 pages and the
  [es manpage](https://wryun.github.io/es-shell/manpage.html) for more
  info.
* Hackable. kwerc is a couple hundred lines of es. Easily integrate with
  your favourite database (want to take advantage of es's powerful I/O
  redirection? try storing data in a plain text file tree or mount a
  database as a FUSE filesystem), code in any language, etc. Even es
  itself can be modified and extended on the fly.
* Powerful. Besides standard shell features, es is extensible and
  functional with support for first class functions, lexical scope,
  exceptions, and rich return values. Need more? kwerc ships with the
  blazing fast [mawk](https://invisible-island.net/mawk/) interpreter
  you can use inline from es. Or, again, easily integrate your favourite
  language (note some languages come with a significant performance hit
  when invoked from shell).
* Fast. Fits in a small ramdisk including a complete set of statically
  compiled Unix command line tools
  ([9base](https://tools.suckless.org/9base/)). Works in a cluster.
  Supports Redis as a primary datastore
  ([kwerc-redis](https://github.com/kfarwell/kwerc-redis).
* Secure. kwerc has strong protections against shell injections. Es's
  quoting rules and overall sensible syntax avoid security bugs that are
  common in other shells. And of course, there is no better security
  feature than simplicity. kwerc is simple by design and implementation,
  and software built with kwerc does more with less code and less bugs.
  Additionally, kwerc is fully self-contained and can be run in a
  read-only chroot or jail.
* Portable. Should run on any typical Unix (someday it may run on Plan 9
  or Inferno as well). No external dependencies. 100% statically
  compiled.

Dependencies
------------

Everything is included in vendor/. You just need C and Golang (>=1.11)
compilers to build. It is highly recommended to build statically for
maximum performance (including any external programs you run from
kwerc). musl is ideal (though may create bugs in 9base in some
environments).

A simple `make` will compile the vendor dependencies and put them in the
right place. You don't need to run `make install` (in fact, you can't)
-- everything is self-contained in the kwerc directory.

Debian:
```
# apt install build-essential golang-go
$ make
```

Alpine:
```
# apk add build-base go
$ make
```

Here is a brief overview of these dependencies:
* es: The es interpreter. Alternatives: rc, any other shell with a
  little porting work.
* 9base: Various Plan 9 tools ported to Unix, providing a nice shell
  environment. Alternatives: coreutils, sbase, busybox, etc. with a
  little porting work.
* mawk: A fast awk interpreter. Alternatives: any other awk
  interpreter.
* kryptgo: A command-line interface to some Golang crypto functions,
  used for auth.
* cgd: A CGI web server. Alternatives: any web server with CGI support
  -- documentation forthcoming.

Usage
-----

`./bin/cgd -c app/es/kwerc.es`

kwerc should now be reachable at http://127.0.0.1:42069. The default
site comes with basic login/registration and a debug page.

Next up: building an actual web app. Documentation is a work in progress
at [kwerc.kfarwell.org](https://kwerc.kfarwell.org).
[werc's documentation](http://werc.cat-v.org/) is also somewhat applicable.

Extensions
----------

* [kwerc-redis](https://github.com/kfarwell/kwerc-redis)

Frequently Questioned Answers
-----------------------------

Q. A web framework in shell? You can't be serious.

A. This isn't bash.

Q. CGI? Isn't that slow?

A. https://www.mail-archive.com/werc9@googlegroups.com/msg00202.html

Q. Static binaries? Aren't those huge/insecure/slow?

A. https://sta.li/faq/

Coming Soon to a kwerc Near You
-------------------------------

* Documentation
* File uploads
* Caching
* PWA support
* ???

Contact
-------

m@kfarwell.org

Donate
------

[Just Send The Money](https://github.com/sponsors/kfarwell)

License
-------

kwerc is distributed under the ISC license. See LICENSE for details.

Dependencies under vendor/ have their own licenses. Read them.

Thanks & History
----------------

kwerc is dedicated to the memory of Uriel. <3

kwerc is based on [werc](http://werc.cat-v.org/), created by Uriel with
contributions from Garbeam, Kris Maglione, sqweek, soul9, mycroftiv,
maht, yiyus, cinap_lenrek, khm and many others.

kwerc incorporates many of the changes from Garbeam's werc fork,
[swerc](https://git.suckless.org/swerc).

Thanks as well to everyone behind the various dependency projects under
vendor/.

Ideas for kwerc come from a variety of projects where I've employed
werc, including ROVR, VRLFP, Tokumei, Gelato Labs, and werchan among
others. Thanks to everyone involved. Special thanks to noted genius and
dear friend Keefer Rourke for much wisdom that has shaped kwerc's
design.
