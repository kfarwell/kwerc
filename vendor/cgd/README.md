CGD - Common Gateway Daemon
===========================

Cgd is a daemon that can serve a CGI script over HTTP or FastCGI.

Useful to run CGI scripts that serve a whole domain (like [kwerc][1]) without
need for a "real" HTTP server, or to wrap CGI scripts so they can be served by
fcgi-only web servers like nginx.

Upstream homepage: <http://repo.cat-v.org/cgd/>


Install Instructions
--------------------

	go get github.com/kfarwell/cgd

Will install as $GOPATH/bin/cgd


License
-------

MIT/CC0/Public Domain

[1]: https://github.com/kfarwell/kwerc
