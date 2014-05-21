# room-sandbox

http://shunjikonishi.github.io/room-sandbox/

This app is a sandbox of WebSocket application.
It is served on Heroku.

You can access it with following url.

    ws[s]://room-sandbox.herokuapp.com/[ANYPATH]

Http(s) protocol is not allowed. It always returns 404.  
With ws(s) protocol, any path is valid.

All clients which access to the same url share a room.  
If one client send a WebSocket message, it will be broadcasted to all members in the same room.
