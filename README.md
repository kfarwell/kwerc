kryptgo
=======

kryptgo is a simple command-line interface to some Golang cryptography
functions, intended to provide everything necessary to implement secure web auth
in portable shell scripts.

* genid: generates secure session IDs
* genhash: generates bcrypt password hashes
* checkhash: checks passwords against bcrypt hashes

kryptgo was made for kwerc[1], a web framework written in es shell.

Installation
------------

    go get github.com/kfarwell/kryptgo

Will install as $GOPATH/bin/kryptgo

Usage
-----

`kryptgo -h`

License
-------

ISC

[1]: https://github.com/kfarwell/kwerc
