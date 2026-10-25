if {!~ $REQUEST_METHOD POST} { return 0 }

# Validate username, availability
if {! only_chars $p_username $allowed_user_chars} {
    throw error 'Invalid username. Allowed characters: [<pre>a-z, A-Z, 0-9, _</pre>]'
}
if {test -d db/users/$p_username} {
    throw error 'An account already exists with this username. Please choose another'
}

# Validate password
if {isempty $p_password ||
    le `{echo $p_password | wc -c} 8} {
    throw error 'Your password must be at least 8 characters long'
}

# Create user
mkdir -p db/users/$p_username
echo -n $p_password | kryptgo genhash > db/users/$p_username/password

login_user $p_username $p_password
