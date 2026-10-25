if {!~ $REQUEST_METHOD POST} { return 0 }

# Validate username, availability
if {! only_chars $p_username $allowed_user_chars} {
    throw error 'Invalid username. Allowed characters: [<pre>a-z, A-Z, 0-9, _</pre>]'
}
if {ls -p db/users | grep -i -s '^'$p_username'$'} {
    throw error 'An account already exists with this username. Please choose another'
}

# Validate password
if {isempty $p_password ||
    le `{echo $p_password | wc -c} 8} {
    throw error 'Your password must be at least 8 characters long'
}

# Create user
mkdir -p db/users
if {! mkdir db/users/$p_username >[2]/dev/null} {
    throw error 'An account already exists with this username. Please choose another'
}
if {! echo -n $p_password | kryptgo genhash > db/users/$p_username/password} {
    rm -r db/users/$p_username
    throw error 'Something went wrong. Please try again later'
}

login_user $p_username $p_password
