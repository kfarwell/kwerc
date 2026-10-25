#!../../bin/es
path = (`{../../bin/pwd | ../../bin/sed 's,app/es,bin,'})

LANG = 'C.UTF-8'

. ./cgi.es
. ./util.es
. ./auth.es
cd ..

kwerc_root = `{pwd}

http_content_type = 'text/html;charset=UTF-8'

if {test -f config} {
    . config
}

site = $SERVER_NAME
if {~ $HTTPS on} {
    protocol = https
} {
    protocol = http
}
# Anonymize IPs to first 2 octets/groups
if {echo $REMOTE_ADDR | grep -s ':'} {
    REMOTE_ADDR = `{echo $REMOTE_ADDR | sed 's/^([^:]*:[^:]*).*/\1:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx/'}
} {
    REMOTE_ADDR = `{echo $REMOTE_ADDR | sed 's/\.[0-9]*\.[0-9]*$//'}^.xxx.xxx
}
base_url = $protocol://$site
dateun = `{date -un}

req_path = `{echo -n $REQUEST_URI | sed 's/\?.*//; s!//+!/!g; s/%5[Ff]/_/g; s/[^a-zA-Z0-9_+\-\/\.,:]//g; s/\.\.*/./g; 1q'}
local_path = $kwerc_root/site$req_path
local_file = ''
args = `` / {echo -n $req_path}
master_template = tpl/master.tpl

# Preload post args for templates where cgi's stdin is not accessible
if {~ $REQUEST_METHOD POST} {
    load_post_args
}
if {! isempty $QUERY_STRING} {
    load_query_args
}

# Do auth
if {~ $REQUEST_METHOD POST && ! cross_site && {~ $^p_logout yes || ~ $req_path /logout}} {
    logout_user
} {
    try login_user
}

# Clean path
if {~ $req_path */index} {
    perm_redirect `{echo $req_path | sed 's,/index$,/,'}
}
if {~ $local_path */} {
    if {test -d $local_path} {
        local_path = $local_path^'index'
    } {ls `{basename -d $local_path}^* >/dev/null >[2=1]} {
        perm_redirect `{echo $req_path | sed 's,/+$,,'}
    }
} {~ $req_path *'.' *',' *';' *':'} {
    perm_redirect `{echo $req_path | sed 's/[.,;:)]$//'}
} {test -d $local_path} {
    perm_redirect $req_path^'/'
}

# Figure out how to handle this file
setup_handlers

echo 'Content-Type: '^$http_content_type
echo # End of HTTP headers

# Logging
dprint $^SERVER_NAME^$^REQUEST_URI - $^HTTP_USER_AGENT - $^REQUEST_METHOD - $^handler_body - $^master_template

if {~ $REQUEST_METHOD HEAD} {
    exit
}

# The fun begins
template $master_template | awk_buffer
