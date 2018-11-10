# Curling-WebSocketCollab
Curling game implemented to practice real-time collaboration with web sockets as well as the handling of collisions between multiple items

Version: v8.12.0
         
OS: Windows 10
Browser: Google Chrome

Install: Open a terminal to the same directory as your server.js code and execute:
         npm install socket.io


Launch:  node server.js

Testing: Use Chrome browser to visit: http://localhost:3000/curlingGame.html
	 
         Taking control of stones: - If the stones are grey, that means you can join the game
                                   - Click "Player 1" or "Player 2" button to join (depending on which is available)
                                   - Game play can only begin when both players are present


                           Aiming: - To shoot the stone click & hold on your rock, drag the mouse, and release
                                   - Velocity is determined by how far you drag the mouse

                     Flow of game: - Players can only click on their stone when it is their turn
                                   - Spectators are not able to handle the stones
                                   - Players and spectators will be notified of who's turn it is below the screen

                 Leaving the game: - To leave the game press the "Player 1 Quit" or "Player 2 Quit" depending on which player you are
                                   - Exiting the game by exiting the window is not a valid exit method
                                   - When a player leaves the game, the remaining participant is notified and told that the game will resume when someone joins the game
                                   - When a player leaves the game, spectators are notified that they can now join

