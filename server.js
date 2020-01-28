

//Cntl+C to stop server
const app = require('http').createServer(handler)
const io = require('socket.io')(app) //wrap server app in socket io capability
const fs = require("fs") //need to read static files
const url = require("url") //to parse url strings

const PORT = process.env.PORT || 3000
app.listen(PORT) //start server listening on PORT

// Game stones: Stones with component "stone" < 20 belong to player 1
//              Stones with component "stone" > 20 belong to player 2
let Stones = []
Stones.push({stone: 11, x: 20, y: 550, vx: 0, vy: 0, moving: false});
Stones.push({stone: 12, x: 50, y: 550, vx: 0, vy: 0, moving: false});
Stones.push({stone: 13, x: 80, y: 550, vx: 0, vy: 0, moving: false});
Stones.push({stone: 21, x: 120, y: 550, vx: 0, vy: 0, moving: false});
Stones.push({stone: 22, x: 150, y: 550, vx: 0, vy: 0, moving: false});
Stones.push({stone: 23, x: 180, y: 550, vx: 0, vy: 0, moving: false});

let p1 ={ on: false, turn: false};
let p2 ={ on: false, turn: false};
let p1Name;
let p2Name;


const ROOT_DIR = "html" //dir to serve static files from

const MIME_TYPES = {
  css: "text/css",
  gif: "image/gif",
  htm: "text/html",
  html: "text/html",
  ico: "image/x-icon",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "application/javascript",
  json: "application/json",
  png: "image/png",
  svg: "image/svg+xml",
  txt: "text/plain"
}

function get_mime(filename) {
  for (let ext in MIME_TYPES) {
    if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
      return MIME_TYPES[ext]
    }
  }
  return MIME_TYPES["txt"]
}

function handler(request, response) {
  let urlObj = url.parse(request.url, true, false)
  console.log('\n============================')
  console.log("PATHNAME: " + urlObj.pathname)
  console.log("REQUEST: " + ROOT_DIR + urlObj.pathname)
  console.log("METHOD: " + request.method)

  let filePath = ROOT_DIR + urlObj.pathname
  if (urlObj.pathname === '/') filePath = ROOT_DIR + '/curlingGame.html'

  fs.readFile(filePath, function(err, data) {
    if (err) {
      //report error to console
      console.log('ERROR: ' + JSON.stringify(err))
      //respond with not found 404 to client
      response.writeHead(404);
      response.end(JSON.stringify(err))
      return
    }
    response.writeHead(200, {
      'Content-Type': get_mime(filePath)
    })
    response.end(data)
  })

}
io.on('connection', function(socket){
  console.log("user connected")

  // synchronize all relevent data between all users. This is important in order to ensure that late coming
  // spectators are shown the current state of the game instead of the initial placement of the curling stones
  socket.on('sync', function(){
      let data = JSON.stringify(Stones);
      let data2 = JSON.stringify(p1);
      let data3 = JSON.stringify(p2);
      let p1data = JSON.stringify(p1Name)
      let p2data = JSON.stringify(p2Name)
      io.emit('sync', data, data2, data3, p1data, p2data) ;
  })

  // broadcast data regarding the currently moving stone
  socket.on('stoneData', function(data, data2){
    let stoneBeingMoved = JSON.parse(data)
    let index = JSON.parse(data2)
    Stones[index] = stoneBeingMoved
    io.emit('stoneData', data, data2) //broadcast to everyone including sender
  })


  socket.on('addPlayer1', function(name){
    p1Name = JSON.parse(name);
    name2 = JSON.stringify(p2Name)
    if(p2.on == true && p2.turn == false){
      p1.turn = true;
    }
      p1.on = true;
      let data = JSON.stringify(p1);
      io.emit('addPlayer1', data, name, name2) ;
  })

  socket.on('addPlayer2', function(name){
    p2Name = JSON.parse(name);
    name2 = JSON.stringify(p1Name)
    if(p1.on == true){
      p1.turn = true;
    }
      p2.on = true;
      let data = JSON.stringify(p2);
      let data2 = JSON.stringify(p1);
      io.emit('addPlayer2', data, data2, name, name2) ;
  })

  socket.on('removePlayer1', function(){
      p1.on = false;
      let data = JSON.stringify(p1);
      io.emit('removePlayer1', data) ;
  })

  socket.on('removePlayer2', function(){
      p2.on = false;
      let data = JSON.stringify(p2);
      io.emit('removePlayer2', data) ;
  })

  socket.on('switchTurns', function(){
     if(p1.turn){
       p1.turn = false;
       p2.turn = true;
     }else{
       p2.turn = false;
       p1.turn = true;
     }
    let data = JSON.stringify(p1);
    let data2 = JSON.stringify(p2);
    io.emit('switchTurns', data, data2) //broadcast to everyone including sender
  })

  socket.on('aimingData', function(data){
    io.emit('aimingData', data) //broadcast to everyone including sender
  })
})
