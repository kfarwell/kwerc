allowed_user_chars = '[a-zA-Z0-9_]'

fn login_user username password {
    if {logged_in} { return 0 }

    if {~ $req_path /login} {
        username = $p_username
        password = $p_password
    }

    if {! isempty $username && ! isempty $password} {
        # Initial login from /login form

        # Normalize case-insensitive username/email -> case-sensitive username
        if {~ $username *@*} {
            username = `{basename `{basename -d `{grep '^'$username'$' db/users/*/email}}}
        } {
            username = `{echo $username | grep '^'$allowed_user_chars'+$'}
            username = `{ls -p db/users | grep -i '^'$username'$'}
        }

        # Goodbye
        if {isempty $username ||
            ! kryptgo checkhash -b `{cat db/users/$username/password} -p $password} {
            dprint Failed login to $username from $HTTP_USER_AGENT on $REMOTE_ADDR
            throw error 'Wrong username/email or password'
        }

        # Generate new session ID
        sessionid = `{kryptgo genid}
        if {~ $sessionid -1} {
            dprint Session generation failed.
            throw error 'Something went wrong. Please try again later'
        }

        # We are logged in!
        logged_user = $username

        # Create session with inactive expiry in 30 mins and absolute expiry in 24 hours
        mkdir -p db/sessions/$sessionid
        echo $username > db/sessions/$sessionid/user
        expiry = `{+ $dateun 1800}
        expiryabs = `{+ $dateun 86400}
        echo $expiry > db/sessions/$sessionid/expiry
        echo $expiryabs > db/sessions/$sessionid/expiryabs

        dprint $logged_user logged in from $HTTP_USER_AGENT on $REMOTE_ADDR
    } {! isempty `{get_cookie id}} {
        # Existing login from session cookie

        sessionid = `{get_cookie id}

        # Check if ID is valid, session exists and is not expired
        if {! echo $sessionid | grep -s '^[a-zA-Z0-9_\-]+$'} {
            set_cookie id logout 'Thu, 01 Jan 1970 00:00:00 GMT'
            throw error 'Invalid session. Please log in again'
        }

        if {! test -d db/sessions/$sessionid ||
            ge $dateun `{cat db/sessions/$sessionid/expiry} ||
            ge $dateun `{cat db/sessions/$sessionid/expiryabs}} {
            if {test -d db/sessions/$sessionid} {
                rm -r db/sessions/$sessionid
            }
            set_cookie id logout 'Thu, 01 Jan 1970 00:00:00 GMT'
            throw error 'Session expired. Please log in again'
        }

        # We are logged in!
        logged_user = `{cat db/sessions/$sessionid/user}

        # Update inactive expiry and get info we'll need later
        expiry = `{+ $dateun 1800}
        expiryabs = `{cat db/sessions/$sessionid/expiryabs}
        echo $expiry > db/sessions/$sessionid/expiry
    } {
        # The user has not requested to log in
        return 0
    }

    # Set session cookie with expiration as min($expiry, $expiryabs)
    if {lt $expiry $expiryabs} {
        set_cookie id $sessionid `{cookiedate `{date -u $expiry}}
    } {
        set_cookie id $sessionid `{cookiedate `{date -u $expiryabs}}
    }

    # If this was an initial login from /login form, redirect...
    if {! isempty $username && ! isempty $password} {
        if {echo $q_redirect | grep -s '^[a-zA-Z0-9_/]+$'} {
            # ...to the provided ?redirect=/path, if it's safe
            post_redirect $q_redirect
        } {
            # ...to the homepage
            post_redirect /
        }
    }
}

fn logout_user {
    # Delete session, expire cookie, and redirect to /login
    sessionid = `{get_cookie id}
    if {echo $sessionid | grep -s '^[a-zA-Z0-9_\-]+$' && test -d db/sessions/$sessionid} {
        rm -r db/sessions/$sessionid
    }
    set_cookie id logout 'Thu, 01 Jan 1970 00:00:00 GMT'
    post_redirect /login
}

fn logged_in { ! isempty $logged_user }
