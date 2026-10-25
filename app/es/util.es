NEWLINE = '
'

# Arithmetic
fn + a b {
    awk -v 'a='$^a -v 'b='$^b 'BEGIN { printf "%f", a + b }' | sed 's/\.?0*$//'
}
fn - a b {
    awk -v 'a='$^a -v 'b='$^b 'BEGIN { printf "%f", a - b }' | sed 's/\.?0*$//'
}
fn x a b {
    awk -v 'a='$^a -v 'b='$^b 'BEGIN { printf "%f", a * b }' | sed 's/\.?0*$//'
}
fn / a b {
    awk -v 'a='$^a -v 'b='$^b 'BEGIN { printf "%f", a / b }' | sed 's/\.?0*$//'
}
fn % a b {
    awk -v 'a='$^a -v 'b='$^b 'BEGIN { printf "%f", a % b }' | sed 's/\.?0*$//'
}
fn int n {
    awk -v 'n='$^n 'BEGIN { printf "%.0f", int(n) }'
}
fn ++ v {
    $v = `{+ $$v 1}
}
fn -- v {
    $v = `{- $$v 1}
}

# Numeric comparisons
fn lt a b {
    ~ `{awk -v 'a='$^a -v 'b='$^b 'BEGIN { print (a + 0 < b + 0) }'} 1
}
fn le a b {
    ~ `{awk -v 'a='$^a -v 'b='$^b 'BEGIN { print (a + 0 <= b + 0) }'} 1
}
fn gt a b {
    ~ `{awk -v 'a='$^a -v 'b='$^b 'BEGIN { print (a + 0 > b + 0) }'} 1
}
fn ge a b {
    ~ `{awk -v 'a='$^a -v 'b='$^b 'BEGIN { print (a + 0 >= b + 0) }'} 1
}
fn min a b {
    if {lt $a $b} {
        echo $a
    } {
        echo $b
    }
}
fn max a b {
    if {gt $a $b} {
        echo $a
    } {
        echo $b
    }
}

# Check if $var is unset, an empty string, or a nil/empty Redis key
fn isempty var {
    ~ $var () || ~ $var '' || ~ $^var '(nil)' || ~ $^var '(empty list or set)' ||
    ~ $^var '(empty,list,or,set)' || ~ $^var '(empty array)' || ~ $^var '(empty,array)'
}

# Check if $1 is in $2, space-delimited
fn in item list {
    ~ `{awk -v 'list='$^list -v 'item='$^item 'BEGIN { split(list, array); for (i in array) if (array[i] == item) print "true" }'} true
}

# Recursively strip string from variable
# e.g. '%0%0%0DDD', '%0D' -> ''
fn deep_strip var str {
    $var = `{echo $$var | sed 's/'$str'//g'}
    if {echo $$var | grep -s $str} {
        deep_strip $var $str
    }
}

# Reverse lines
fn tac {
    awk '{ a[i++] = $0 } END { for (j = i - 1; j >= 0;) print a[j--] }'
}

# Randomize order of lines
fn shuf {
    awk '{print rand(), $0}' | sort -n | sed 's/^[0-9.]* //'
}

# Use "OS" command rather than shell builtin
fn os cmd args {
    $kwerc_root/../bin/$cmd $args
}

# Benchmark command
fn time cmd {
    t = `{/usr/bin/date +%s.%N}
    $cmd
    echo `{- `{/usr/bin/date +%s.%N} $t}
}

# date(1) output -> YYYYMMDD format
# e.g. 'Tue Aug 16 17:03:52 CDT 1977' -> 19770816
fn yyyymmdd date {
    echo $date | sed 's/....(...).(..)..............(....)/\3\1\2/; s/Jan/01/; s/Feb/02/; s/Mar/03/; s/Apr/04/; s/May/05/; s/Jun/06/; s/Jul/07/; s/Aug/08/; s/Sep/09/; s/Oct/10/; s/Nov/11/; s/Dec/12/'
}

# date(1) output -> HTTP cookie format
# e.g. 'Tue Aug 16 17:03:52 CDT 1977' -> 'Tue, 16 Aug 1977 17:03:52 CDT'
fn cookiedate date {
    echo $date | sed 's/(...) (...) (..) (........) (...) (....)/\1, \3 \2 \6 \4 \5/; s/  / 0/'
}

# Catch errors for display
fn try f {
    catch @ e msg {
        if {~ $e error} {
            notice = $msg
        }
    } {
        $f
    }
}

# If not logged in, redirect to /login and back
fn require_login {
    if {!logged_in} {
        post_redirect /login?redirect'='$req_path
    }
}

# http://werc.cat-v.org/docs/rc-template-lang
fn template file {
    awk '
    function pr(str) {
        if (lastc !~ "[{(]")
            gsub(/''/, "''''", str)
        printf "%s", str
    }
    function trans(c) {
        printf "%s", end

        lastc = c
        end = "\n"
        if (c == "%")
            end = ""
        else if (c == "(")
            printf "echo -n "
        else if (c ~ "[})]") {
            end = "''\n"
            printf "echo -n ''"
        }
    }

    BEGIN {
        lastc = "{"
        trans("}")
    }
    END {
        print end
    }

    /^%/ && $0 !~ /^%[{()}%]/ && lastc !~ /[({]/ {
        trans("%")
        print substr($0, 2)
        next
    }
    {
        if (lastc == "%")
            trans("}")
        n = split($0, a, "%")
        pr(a[1])
        for (i = 2; i <= n; i++) {
            c = substr(a[i], 1, 1)
            rest = substr(a[i], 2)

            if ((lastc !~ "[({]" && c ~ "[({]") ||
                (lastc == "{" && c == "}") ||
                (lastc == "(" && c == ")"))
                trans(c)
            else if (c == "%")
                pr("%")
            else
                pr("%" c)
            pr(rest)
        }
        pr("\n")
    }
    ' $file | es
}

# Figure out how to handle this file
fn setup_handlers {
    if {test -f $local_path.es} {
        try . $local_path.es
    }

    if {~ $req_path /api/*} {
        master_template = tpl/plain.tpl
    }

    if {test -f $local_path.tpl} {
        local_file = $local_path.tpl
        handler_body = (template $local_file)
    } {test -f $local_path.html} {
        local_file = $local_path.html
        handler_body = (cat $local_file)
    } {~ $local_path *.html || ~ $local_path *.tpl || ~ $local_path *.es && test -f $local_path} {
        perm_redirect `{echo $req_path | sed 's/\.html$//; s/\.tpl$//; s/\.es$//'}
    } {test -f $local_path} {
        static_file $local_path
    } {test -f `{echo $local_path | sed 's/\/[^\/]*$//'}^.tpl} {
        local_file = `{echo $local_path | sed 's/\/[^\/]*$//'}^.tpl
        handler_body = (template $local_file)
    } {~ $req_path /api/*} {
        handler_body = (echo)
    } {
        handler_body = (template tpl/404.tpl)
        echo 'Status: 404 Not Found'
    }
}

# Sanitization
fn escape_html {
    sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g; s/"/\&quot;/g; s/''/\&#39;/g'
}

fn sanitize_partial_url {
    url = `{cat | sed 's/ /%20/g; s/[^a-zA-Z0-9-~+_.?#=!&;,\/:%@$|*\''()\\x80-\\xff]//g; s/''/\&#039;/g'}

    deep_strip url '%0d'
    deep_strip url '%0a'
    deep_strip url '%0D'
    deep_strip url '%0A'

    echo $url
}
fn sanitize_url {
    url = `{sanitize_partial_url}

    if {! isempty $url && !~ $url http://* && !~ $url https://*} {
        url = http://$url
    }

    echo $url
}
