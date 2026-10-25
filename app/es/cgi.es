# Print to stderr for debug logging
fn dprint msg { echo $msg >[1=2] }

# Redirects
fn http_redirect url status {
    if {~ $url http://* https://*} {
        t = $url
    } {~ $url /*} {
        t = $^base_url^$url
    } {
        t = $^base_url^$^req_path^$url
    }
    echo 'Status: '^$status^'
Location: '^$t^'

'
    exit
}
fn perm_redirect url { http_redirect $url '301 Moved Permanantly' }
fn post_redirect url { http_redirect $url '303 See Other' }

# Byte-wise arg filters: arg_name keeps only [a-zA-Z0-9_], strip_cr deletes CRs
fn arg_name {
    awk 'BEGIN { RS = "[^a-zA-Z0-9_]+"; ORS = "" } { print }'
}
fn strip_cr {
    awk 'BEGIN { RS = "\r"; ORS = "" } { print }'
}

# POST args -> $p_key=value
# Note: should check if content type is application/x-www-form-urlencoded?
# Should compare with http://www.shelldorado.com/scripts/cmds/urlgetopt.txt
fn load_post_args {
    if {~ $REQUEST_METHOD POST && ~ $#post_args 0} {
        for (pair = `` \&\n {cat}) {
            pair = `` '=' {echo -n $pair}
            n = 'p_'^`{echo $pair(1) | urldecode | arg_name}
            post_args = ($post_args $n)
            $n = `` () {echo -n $pair(2) | urldecode | strip_cr}
        }
        pair = ()
    }
}
# Query args -> $q_key=value
fn load_query_args {
    if {~ $#query_args 0} {
        for (pair = `` \&\n {echo -n $QUERY_STRING}) {
            pair = `` '=' {echo -n $pair}
            n = 'q_'^`{echo $pair(1) | urldecode | arg_name}
            query_args = ($query_args $n)
            $n = `` () {echo -n $pair(2) | urldecode | strip_cr}
        }
        pair = ()
    }
}

# This seems to slightly improve performance, but might depend on httpd buffering behavior.
fn awk_buffer {
    awk '
    {
        buf = buf $0"\n"
        if (length(buf) > 1400) {
            printf "%s", buf
            buf = ""
        }
    }
    END { printf "%s", buf }
    '
}

# Decode/encode strings for URLs
fn urldecode {
    awk 'BEGIN {printf "'`^{sed 's/\+/ /g; s/\\/\\\\/g; s/"/\\"/g; s/%([0-9a-fA-F][0-9a-fA-F])/\\x\1/g'}^'"}'
}
fn urlencode {
    awk '
    BEGIN {
        # We assume an awk implementation that is just plain dumb.
        # We will convert an character to its ASCII value with the
        # table ord[], and produce two-digit hexadecimal output
        # without the printf("%02X") feature.

        EOL = "%0A" # "end of line" string (encoded)
        split ("1 2 3 4 5 6 7 8 9 A B C D E F", hextab, " ")
        hextab [0] = 0
        for (i = 1; i <= 255; ++i)
            ord [ sprintf ("%c", i) "" ] = i + 0
        if ("'^$^EncodeEOL^'" == "yes")
            EncodeEOL = 1
        else
            EncodeEOL = 0
    }
    {
        encoded = ""
        for (i = 1; i <= length($0); ++i) {
            c = substr ($0, i, 1)
            if (c ~ /[a-zA-Z0-9.-]/) {
                encoded = encoded c   # safe character
            } else if (c == " ") {
                encoded = encoded "+" # special handling
            } else {
                # unsafe character, encode it as a two-digit hex-number
                lo = ord [c] % 16
                hi = int (ord [c] / 16);
                encoded = encoded "%" hextab [hi] hextab [lo]
            }
        }
        if (EncodeEOL) {
            printf ("%s", encoded EOL)
        } else {
            print encoded
        }
    }
    END {
        #if (EncodeEOL) print ""
    }
    ' $*
}

# Cookies
fn set_cookie name val expiry {
    if {isempty $expiry} {
        echo 'Set-cookie: '^$^name^'='^$^val^'; Path=/; Secure; HttpOnly'
    } {
        echo 'Set-cookie: '^$^name^'='^$^val^'; Expires='$^expiry'; Path=/; Secure; HttpOnly'
    }
}
fn get_cookie name {
    co = `` ';' {echo $HTTP_COOKIE}

    # XXX: we might be adding a trailing new line?
    # The ' ?' is needed to deal with '; ' inter-cookie delimiter
    { for (c = $co) echo $c } | sed -n 's/^ ?'$name'=//p'
}

# Serve plain boring file
fn static_file file {
    echo 'Content-Type: '`{select_mime $file}
    echo
    cat $file
    exit
}

# Set MIME type from file extension
fn select_mime file {
    m = text/plain
    if {~ $file *.css} {
        m = text/css
    } {~ $file *.ico} {
        m = image/x-icon
    } {~ $file *.png} {
        m = image/png
    } {~ $file *.jpg *.jpeg} {
        m = image/jpeg
    } {~ $file *.gif} {
        m = image/gif
    } {~ $file *.pdf} {
        m = application/pdf
    }
    echo $m
}
