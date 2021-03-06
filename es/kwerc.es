#!/path/to/kwerc/bin/es
. ./util.es
. ./handlers.es
. ./resdis.es
cd ..

forbidden_uri_chars='[^a-zA-Z0-9_+\-\/\.,:]'

# Expected input: ls -F style, $sitedir/path/to/files/
#          <ls -F+x><symlink hack><Useless?><hiden files  >
dirfilter='s/\*$//; s,/+\./+,/,g; s,^\./,,; /\/[._][^\/]/d; /'$forbidden_uri_chars'/d; /\/index\.(md|html|txt|tpl)$/d; /\/robots\.txt$/d; /_kwerc\/?$/d; '
dirclean=' s/\.(tpl|md|html|txt)$//; '

http_content_type='text/html'
kwerc_root=`{pwd}

if {test -f config} {
    . ./config
} {
    . ./config.example
}

fn kwerc_exec_request {
    site=$SERVER_NAME
    if {~ $HTTPS on} {
        protocol=https
    } {
        protocol=http
    }
    base_url=$protocol://$site
    sitedir=$kwerc_root/site
    current_date_time=`{date}

    # Note: $REQUEST_URI is not officially in CGI 1.1, but seems to be de-facto
    # Note: We only urldecode %5F->'_' because some sites (stackoverflow.com?) urlencode it in their links,
    # perhaps we should completely urldecode the whole url.
    req_path=`{echo -n $REQUEST_URI | sed 's/\?.*//; s!//+!/!g; s/%5[Ff]/_/g; s/'^$forbidden_uri_chars^'//g; s/\.\.*/./g; 1q'}
    req_url=$base_url^$req_path
    local_path=$sitedir$req_path
    local_file=''
    args=`` / {echo -n $req_path}
    master_template=`{get_tpl_file master.tpl}

    # Preload post args for templates where cgi's stdin is not accessible
    if {~ $REQUEST_METHOD POST} {
        load_post_args
    }

    if {~ $req_path */index} {
        perm_redirect `{echo $req_path | sed 's,/index$,/,'}
    }

    if {~ $local_path */} {
        if {test -d $local_path} {
            local_path=$local_path^'index'
        } {ls `{basename -d $local_path}^* >/dev/null >[2=1]} {
            perm_redirect `{echo $req_path | sed 's,/+$,,'}
        }
    } {~ $req_path *'.' *',' *';' *':'} {
        perm_redirect `{echo $req_path | sed 's/[.,;:)]$//'}
    } {test -d $local_path} {
        perm_redirect $req_path^'/'
    }

    cd $sitedir
    req_paths_list='/' # Note: req_paths_list doesn't include 'synthetic' dirs.
    conf_wd='/' # Used in config files to know where we are in the document tree.
    if {test -f _kwerc/config} {
        . _kwerc/config
    }
    for(i = $args) {
        conf_wd=$conf_wd^$i
        req_paths_list=($req_paths_list $conf_wd)
        if {test -d $i} {
            conf_wd=$conf_wd'/'
            cd $i
            if {test -f _kwerc/config}
                . _kwerc/config
        }
    }
    cd $kwerc_root

    if {~ $#perm_redir_to 1} {
        perm_redirect $perm_redir_to
    }
    for(l = $perm_redir_patterns) {
        p=$$l
        r=$p(1)
        # If target is absolute, then pattern must match whole string
        if {~ $p(2) http://* https://*} {
            r='^'$r
        }
        t=`{ echo $req_path | sed 's!'^$r^'!'^$p(2)^'!' } # Malicious danger!

        if {! ~ $^t '' $req_path} {
            perm_redirect $t
        }
    }

    setup_handlers

    for(h = $extraHttpHeaders) {
        echo $h
    }
    echo 'Content-Type: '^$http_content_type
    echo # End of HTTP headers

    dprint $^SERVER_NAME^$^REQUEST_URI - $^HTTP_USER_AGENT - $^REQUEST_METHOD - $^handler_body_main - $^master_template

    if {~ $REQUEST_METHOD HEAD} {
        exit
    }

    template $master_template | awk_buffer
}

kwerc_exec_request
