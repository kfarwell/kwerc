% if {!~ $^debug true || !~ $logged_user admin} { return 0 }

<h1>Debug</h1>
<form method="POST" name="prompt">
    <input type="text" name="command" value="%(`{echo $^p_command | escape_html}%)" autofocus>
    <button type="submit">Run</button>
</form>
    
<pre style="overflow-x: auto">
%   if {! isempty $p_command && ! cross_site} {
%       es -xc $p_command >[2=1] | escape_html
%   }
    <hr />
%   vars | escape_html
</pre>
