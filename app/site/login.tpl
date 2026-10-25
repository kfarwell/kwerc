% if {!logged_in} {
      <h1>Login</h1>
      <form action="" method="POST">
          <label for="username">Username:</label>
          <input type="text" name="username" id="username" required autocomplete="username" placeholder="kwercfan42" value="%(`{echo $^p_username | escape_html}%)">

          <label for="password">Password:</label>
          <input type="password" name="password" id="password" required autocomplete="current-password" placeholder="••••••••••••••••">

          <button type="submit">Login</button>
      </form>

      <p>Don't have an account yet?</p>
      <a href="/register">Register</a>
% } {
      <h1>Login</h1>
      <p>You're already logged in!</p>
      <form action="/logout" method="POST">
          <button type="submit" name="logout" value="yes">Logout</button>
      </form>
% }
