
// Game stones: Stones with component "stone" < 20 belong to player 1
//              Stones with component "stone" > 20 belong to player 2
let Stones = []
Stones.push({stone: 11, x: 20, y: 540, vx: 0, vy: 0, moving: false});
Stones.push({stone: 12, x: 50, y: 540, vx: 0, vy: 0, moving: false});
Stones.push({stone: 13, x: 80, y: 540, vx: 0, vy: 0, moving: false});
Stones.push({stone: 21, x: 120, y: 540, vx: 0, vy: 0, moving: false});
Stones.push({stone: 22, x: 150, y: 540, vx: 0, vy: 0, moving: false});
Stones.push({stone: 23, x: 180, y: 540, vx: 0, vy: 0, moving: false});

let p1Name;
let p2Name;
let isP1 = false;
let isP2 = false;
let p1 ={ on: false, turn: false};
let p2 ={ on: false, turn: false};

let listOfMovingStones = []

const stoneWidth = 20;
const stoneHeight = 20;
const stoneRadius = 10;
const friction = 0.97; //friction factor

let aiming = {x:0, y:0, on: false};


//connect to server and retain the socket
//let socket = io('http://localhost:3000')
socket.on('addPlayer1', function(data, name){
  p1Name = JSON.parse(name);
  p1 = JSON.parse(data);
  let line = p1Name  + " has entered the game!";
  p1text.innerHTML =  `<p> ${line}</p>`

  if(p1.turn == true){
    document.getElementById("play-by-play").innerHTML = p1Name + "'s Turn"
    $("#canvasRight").mousedown(handleMouseDown1);
  }else if(p2.turn == true){
    document.getElementById("play-by-play").innerHTML = p2Name + "'s Turn"
    $("#canvasRight").mousedown(handleMouseDown2);
  }
  drawCanvas()
})

// Syncs the data between all players and spectators
socket.on('sync',function(data, data2, data3, p1data, p2data){
  Stones = JSON.parse(data)
  p1 = JSON.parse(data2)
  p2 = JSON.parse(data3)
  p1Name = JSON.parse(p1data)
  p2Name = JSON.parse(p2data)
  drawCanvas()
})

socket.on('addPlayer2',function(data, data2, name){
  p2Name = JSON.parse(name);
  p2 = JSON.parse(data)
  p1 = JSON.parse(data2)

  let line = p2Name  + " has entered the game!";
  p2text.innerHTML =  `<p> ${line}</p>`

  if(p1.turn == true){
    document.getElementById("play-by-play").innerHTML = p1Name + "'s Turn"
    $("#canvasRight").mousedown(handleMouseDown1);
  } else if(p2.turn == true){
    document.getElementById("play-by-play").innerHTML = p1Name + "'s Turn"
    $("#canvasRight").mousedown(handleMouseDown2);
  }
  drawCanvas()
})

socket.on('removePlayer1',function(data){
  if(isP2){
    alert("Player 1 has left! The game will resume when another player joins")
  }
  if(isP1 == false && isP2 == false){
    alert("Player 1 has left! You can now join the game")
  }

  let line = p1Name  + " has left the game!";
  p1text.innerHTML =  `<p> ${line}</p>`
  isP1 = false
  p1 = JSON.parse(data)
  $("#canvasRight").off("mousedown", handleMouseDown1);
  $("#canvasRight").off("mousedown", handleMouseDown2);
  drawCanvas()
})

socket.on('removePlayer2',function(data){
  p2 = JSON.parse(data)
  isP2 = false
  $("#canvasRight").off("mousedown", handleMouseDown1);
  $("#canvasRight").off("mousedown", handleMouseDown2);
  drawCanvas()
})

socket.on('switchTurns',function(data, data2){
  p1 = JSON.parse(data)
  p2 = JSON.parse(data2)

  if(p1.turn == true){
    document.getElementById("play-by-play").innerHTML = p1Name + "'s Turn"
    $("#canvasRight").mousedown(handleMouseDown1);
    $("#canvasRight").off("mousedown", handleMouseDown2);
  }else if(p2.turn == true){
    document.getElementById("play-by-play").innerHTML = p2Name + "'s Turn"
    $("#canvasRight").mousedown(handleMouseDown2);
    $("#canvasRight").off("mousedown", handleMouseDown1);
  }
})

socket.on('stoneData', function(data, data2) {
  stoneBeingMoved = JSON.parse(data)
  let index = JSON.parse(data2)
  Stones[index] = stoneBeingMoved
  //e.stopPropagation()
  //e.preventDefault()
  drawCanvas()
})

socket.on('aimingData', function(data) {
  let locationData = JSON.parse(data)
  aiming.x = locationData.x
  aiming.y = locationData.y
  drawCanvas()
})

let p1text = document.getElementById("text-area1");
let p2text = document.getElementById("text-area2");

let timer
let pollingTimer

let stoneBeingMoved; //stone being dragged by mouse


let deltaX, deltaY //location where mouse is pressed
let canvas1 = document.getElementById("canvasCloseup")// drawing canvas for the closeup view of the curling game
let canvas2 = document.getElementById("canvasRight") //drawing canvas for the long view of the curling game


function getStoneAtLocation(aCanvasX, aCanvasY, start, stop) {
  //locate the stone targeted by aCanvasX, aCanvasY
  //the start and stop component allows us to isolate p1 and p2 stones based on who's turn it is
  const context = canvas2.getContext("2d");

  for (let i = start; i < stop; i++) {
    if (
      aCanvasX > Stones[i].x - stoneRadius &&
      aCanvasX < Stones[i].x + stoneRadius &&
      (aCanvasY > Stones[i].y - stoneRadius && aCanvasY < Stones[i].y + stoneRadius)
    ) {
      //set word targeting rectangle for debugging display
      stoneTargetRect = {
        x: Stones[i].x,
        y: Stones[i].y - stoneHeight,
        width: stoneWidth,
        height: stoneHeight
      }
      return Stones[i] //return the stone found
    }
  }
  return null // no stone found at location
}


function drawCanvas() {
  const contextCloseUp = canvas1.getContext("2d");
  const context = canvas2.getContext("2d");

  contextCloseUp.fillStyle = "white";
  contextCloseUp.fillRect(0, 0, canvas1.width, canvas1.height); //erase canvas

  context.fillStyle = "white";
  context.fillRect(0, 0, canvas2.width, canvas2.height);

  //draw curling close up
  contextCloseUp.beginPath()
  contextCloseUp.arc(
    canvas1.width  / 2, //x co-ord
    canvas1.height / 2, //y co-ord
    canvas1.height / 2 - 25, //radius
    0, //start angle
    2 * Math.PI //end angle
  )
  contextCloseUp.stroke();
  contextCloseUp.fillStyle = "blue";
  contextCloseUp.fill()

  contextCloseUp.beginPath()
  contextCloseUp.arc(
    canvas1.width  / 2, //x co-ord
    canvas1.height / 2, //y co-ord
    canvas1.height / 2 - 100, //radius
    0, //start angle
    2 * Math.PI //end angle
  )
  contextCloseUp.stroke();
  contextCloseUp.fillStyle = "white";
  contextCloseUp.fill()

  contextCloseUp.beginPath()
  contextCloseUp.arc(
    canvas1.width  / 2, //x co-ord
    canvas1.height / 2, //y co-ord
    canvas1.height / 2 - 175, //radius
    0, //start angle
    2 * Math.PI //end angle
  )
  contextCloseUp.stroke();
  contextCloseUp.fillStyle = "red";
  contextCloseUp.fill()

  contextCloseUp.beginPath()
  contextCloseUp.arc(
    canvas1.width  / 2, //x co-ord
    canvas1.height / 2, //y co-ord
    canvas1.height / 2 - 250, //radius
    0, //start angle
    2 * Math.PI //end angle
  )
  contextCloseUp.stroke();
  contextCloseUp.fillStyle = "white";
  contextCloseUp.fill()

  //draw curling long view
  context.beginPath()
  context.arc(
    canvas2.width / 2, //x co-ord
    canvas2.width / 2, //y co-ord
    canvas2.width / 2 - 8.33333, //radius
    0, //start angle
    2 * Math.PI //end angle
  )
  context.stroke()
  context.fillStyle = "blue";
  context.fill()

  context.beginPath()
  context.arc(
    canvas2.width / 2, //x co-ord
    canvas2.width / 2, //y co-ord
    canvas2.width / 2 - 33.33333, //radius
    0, //start angle
    2 * Math.PI //end angle
  )
  context.stroke()
  context.fillStyle = "white";
  context.fill()

  context.beginPath()
  context.arc(
    canvas2.width / 2, //x co-ord
    canvas2.width / 2, //y co-ord
    canvas2.width / 2 - 58.33333, //radius
    0, //start angle
    2 * Math.PI //end angle
  )
  context.stroke()
  context.fillStyle = "red";
  context.fill()

  context.beginPath()
  context.arc(
    canvas2.width / 2, //x co-ord
    canvas2.width / 2, //y co-ord
    canvas2.width / 2 - 83.33333, //radius
    0, //start angle
    2 * Math.PI //end angle
  )
  context.stroke()
  context.fillStyle = "white";
  context.fill()


  // Drawing all of the stones
  for (let i = 0; i < Stones.length; i++) {
    let data = Stones[i]
    context.beginPath();
    context.arc(data.x,data.y, stoneRadius,0,2*Math.PI);
    context.stroke();
    context.fillStyle = "grey";
    context.fill();

    // If p1 has joined the game, make the stones yellow
    if(p1.on && Stones[i].stone < 20){
      context.beginPath();
      context.arc(data.x,data.y, stoneRadius-5,0,2*Math.PI);
      context.stroke();
      context.fillStyle = "yellow";
      context.fill();
    }
    // If p12 has joined the game, make the stones red
    if(p2.on && Stones[i].stone > 20){
      context.beginPath();
      context.arc(data.x,data.y, stoneRadius-5,0,2*Math.PI);
      context.stroke();
      context.fillStyle = "red";
      context.fill();
    }

    // transform the long view data to create a close up
    if(data.y < (canvas2.width + stoneWidth)){
      let x = data.x*3;
      let y = data.y*3
      let greyRadius = stoneRadius *3;
      let innerRadius = (stoneRadius-5)*3;

      contextCloseUp.beginPath();
      contextCloseUp.arc(x,y, greyRadius,0,2*Math.PI);
      contextCloseUp.stroke();
      contextCloseUp.fillStyle = "grey";
      contextCloseUp.fill();


      if(p1.on && Stones[i].stone < 20){
        contextCloseUp.beginPath();
        contextCloseUp.arc(x,y, innerRadius,0,2*Math.PI);
        contextCloseUp.stroke();
        contextCloseUp.fillStyle = "yellow";
        contextCloseUp.fill();
      }
      if(p2.on && Stones[i].stone > 20){
        contextCloseUp.beginPath();
        contextCloseUp.arc(x,y, innerRadius,0,2*Math.PI);
        contextCloseUp.stroke();
        contextCloseUp.fillStyle = "red";
        contextCloseUp.fill();
      }
    }
  }

  if(aiming.on == true){
    context.beginPath()
    context.moveTo(stoneBeingMoved.x, stoneBeingMoved.y);
    context.lineTo(aiming.x, aiming.y);
    context.stroke();
  }



}

function getCanvasMouseLocation(e) {
  //provide the mouse location relative to the upper left corner
  //of the canvas

  let rect = canvas2.getBoundingClientRect()

  //account for amount the document scroll bars might be scrolled
  let scrollOffsetX = $(document).scrollLeft()
  let scrollOffsetY = $(document).scrollTop()

  let canX = e.pageX - rect.left - scrollOffsetX
  let canY = e.pageY - rect.top - scrollOffsetY
  return {
    canvasX: canX,
    canvasY: canY
  }

}

function handleMouseDown1(e) {

  // both players must be present, this specific client must be player 1, and it must be their turn
  if(isP1 && p2.on && p1.turn){
    let canvasMouseLoc = getCanvasMouseLocation(e)
    let canvasX = canvasMouseLoc.canvasX
    let canvasY = canvasMouseLoc.canvasY
    console.log("mouse down:" + canvasX + ", " + canvasY)

    stoneBeingMoved = getStoneAtLocation(canvasX, canvasY, 0, 3)
    //console.log(wordBeingMoved.word);
    if (stoneBeingMoved != null) {
      //setting deltaX and deltaY to 0
      deltaX = stoneBeingMoved.x - canvasX
      deltaY = stoneBeingMoved.y - canvasY
      aiming.on = true;
      $("#canvasRight").mousemove(handleMouseMove)
      $("#canvasRight").mouseup(handleMouseUp);
    }

    // Stop propagation of the event and stop any default
    //  browser action
    e.stopPropagation()
    e.preventDefault()

    drawCanvas()
  }
}

function handleMouseDown2(e) {
  // both players must be present, this specific client must be player 2, and it must be their turn
  if(isP2 && p2.on && p2.turn){
    let canvasMouseLoc = getCanvasMouseLocation(e)
    let canvasX = canvasMouseLoc.canvasX
    let canvasY = canvasMouseLoc.canvasY
    console.log("mouse down:" + canvasX + ", " + canvasY)

    stoneBeingMoved = getStoneAtLocation(canvasX, canvasY, 3, 6)
    //console.log(wordBeingMoved.word);
    if (stoneBeingMoved != null) {
      //setting deltaX and deltaY to 0
      deltaX = stoneBeingMoved.x - canvasX
      deltaY = stoneBeingMoved.y - canvasY
      aiming.on = true;
      $("#canvasRight").mousemove(handleMouseMove)
      $("#canvasRight").mouseup(handleMouseUp);
    }

    // Stop propagation of the event and stop any default
    //  browser action

    e.stopPropagation()
    e.preventDefault()

    drawCanvas()
  }
}

function handleMouseMove(e) {

  let canvasMouseLoc = getCanvasMouseLocation(e);
  let canvasX = canvasMouseLoc.canvasX;
  let canvasY = canvasMouseLoc.canvasY;

  aiming.x = canvasX;
  aiming.y = canvasY;
  let dataObj = {
    x: aiming.x,
    y: aiming.y
  }

  let jsonString = JSON.stringify(dataObj)
  socket.emit('aimingData', jsonString)
}


function handleMouseUp(e) {
  e.stopPropagation()
  let dx = stoneBeingMoved.x - aiming.x;
  let dy = stoneBeingMoved.y - aiming.y;

  aiming.on = false; //removing our aiming mark

  stoneBeingMoved.vx = dx/7;
  stoneBeingMoved.vy = dy/7;
  stoneBeingMoved.moving = true;

  listOfMovingStones.push(stoneBeingMoved);

  //remove mouse move and mouse up handlers but leave mouse down handler
  $("#canvasRight").off("mousemove", handleMouseMove); //remove mouse move handler
  $("#canvasRight").off("mouseup", handleMouseUp); //remove mouse up handler
  $("#canvasRight").off("mousedown", handleMouseDown1); //remove mouse up handler
  $("#canvasRight").off("mousedown", handleMouseDown2); //remove mouse up handler

  //switch the player's TURN
  socket.emit('switchTurns')
  drawCanvas() //redraw the canvas
}


function handleTimer() {

  if(p1.on == false){
    let line = "You can join as Player 1";
    p1text.innerHTML =  `<p> ${line}</p>`
  }
  if(p2.on == false){
    let line = "You can join as Player 2";
    p2text.innerHTML =  `<p> ${line}</p>`
  }


  // update the stones location when it is moving && handle collisions
  for(let i = 0; i < Stones.length; i++){
    if(Stones[i].moving){
      stoneBeingMoved = Stones[i];
      Stones[i].x += Stones[i].vx * 2;
      Stones[i].y += Stones[i].vy * 2;

      let absVx = Math.abs(Stones[i].vx);
      let absVy = Math.abs(Stones[i].vy);

      Stones[i].vx *= friction;
      Stones[i].vy *= friction;

      if((absVx < 0.5) && (absVy < 0.5)){
        Stones[i].moving = false;
        stoneBeingMoved.moving = false;
        Stones[i].vx = 0;
        Stones[i].vy = 0;
      }else{
        checkWallContact(Stones[i]);
        let collide = checkStoneContact(Stones[i]);
        if(collide != null){
          handleCollision(Stones[i], collide);
        }
      }

      for(let j = 0; j < Stones.length; j++){
        if(Stones[j].moving){

          let jsonString = JSON.stringify(Stones[j]);
          let jsonString2 = JSON.stringify(j);

          socket.emit('stoneData', jsonString, jsonString2);
        }
      }

    }
  }
}

function handleCollision(stone1, stone2){
  //stone1 is the moving stone

  let v = Math.sqrt((stone1.vx * stone1.vx) + (stone1.vy * stone1.vy));
  let dx = Math.abs(stone1.x - stone2.x);
  let dy = Math.abs(stone1.y - stone2.y);
  let dist = Math.sqrt(dx*dx + dy*dy); // distance between 2 stones

  if(dist != 0){

    let angle_b = Math.asin(dy/dist); // angle of line of impact with horizontal
    let angle_d = Math.asin(Math.abs(stone1.vx)/v); // angle of stone1 velocity wrt vertical
    let angle_a = (3.14159/2.0) - angle_b - angle_d; // angle of stone1 velocity line of impact
    let angle_c = angle_b - angle_a;  // angle of stone 1 departure wrt horizonta

    let v1 = v * Math.abs(Math.sin(angle_a));
    let v2 = v* Math.abs(Math.cos(angle_a));

    let v1x = v1 * Math.abs(Math.cos(angle_c));
    let v1y = v1 * Math.abs(Math.sin(angle_c));
    let v2x = v2 * Math.abs(Math.cos(angle_b));
    let v2y = v2 * Math.abs(Math.sin(angle_b));

    //set directions based on initial direction of hitting stone
     //set horizontal directions
     stone2.moving = true;
     listOfMovingStones.push(stone2);
     if(stone1.vx > 0){//ball1 is going right
        if(stone1.x < stone2.x) {
            v1x = -v1x;
        } else {
          v2x = -v2x;
        }
     }else {
       	if(stone1.x > stone2.x){
          v2x = -v2x;
        } else{
          v1x = -v1x;
        }

    }

    //set vertical directions
    if(stone1.vy > 0){
       if(stone1.y < stone2.y) {
           v1y = -v1y;
       } else {
         v2y = -v2y;
       }
    }else {
       if(stone1.y > stone2.y){
         v2y = -v2y;
       } else{
         v1y = -v1y;
       }
    }

    // set new velocities
    stone1.vx = v1x;
    stone1.vy = v1y;
    stone2.vx = v2x;
    stone2.vy = v2y
  }
}

function checkWallContact(stone){

  if((stone.x + stoneRadius > canvasRight.width) || (stone.x - stoneRadius < 0)){
    stone.vx*= -0.9;
  }
  if((stone.y + stoneRadius > canvasRight.height) || (stone.y - stoneRadius < 0)){
    stone.vy*= -0.9;
  }
}

function checkStoneContact(stone){

  let posX = stone.x;
  let posY = stone.y;

  for(let i = 0; i < Stones.length; i++){
    let otherStone = Stones[i];
    if(otherStone != stone){

      let dx = Math.abs(posX - otherStone.x);
      let dy = Math.abs(posY - otherStone.y);
      let dist = Math.sqrt(dx*dx + dy*dy);
      if( dist < 2*stoneRadius){
        console.log("COLLISION " + dist + " " + stoneRadius);

        return otherStone;
      }
    }

  }
  return null;
}

function handlePlayer1Button(){

  if(p1.on == false && isP2 == false){
    let tempname = prompt("Please enter your name", "Player 1");
    if (tempname != null) {
        let dataObj = JSON.stringify(tempname)

        socket.emit('addPlayer1', dataObj);
        isP1 = true;
    }

  }

}

function handlePlayer2Button(){

  if(p2.on == false && isP1 == false){

    let tempname = prompt("Please enter your name", "Player 2");
    if (tempname != null) {
        let dataObj = JSON.stringify(tempname)
        // document.getElementById("text-area").innerHTML =  p2name + " has entered the game"
        socket.emit('addPlayer2', dataObj);
        isP2 = true
    }


  }
}

function handleP1QuitButton(){

  if(p1.on == true && isP1 == true ){
    console.log("PLAYER 1 is leaving");
    socket.emit('removePlayer1');

  }
}

function handleP2QuitButton(){

  if(p2.on == true && isP2 == true){
    console.log("PLAYER 2 is leaving");
    socket.emit('removePlayer2');

  }
}




$(document).ready(function() {
  //when a new window is opened sync the data to match the participating clients
  socket.emit('sync');
  timer = setInterval(handleTimer, 100) //tenth of second
  drawCanvas()
})
