const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
var cors = require('cors');

app.use(cors())

let roomId = 1167;

const roomsDetails = {}


io.on('connection', (socket) => { 
    console.log('Connected');
    
    socket.on('init',(data, cb)=>{
        cb('connected to server');
    })

    socket.on('message',(data)=>{
        socket.broadcast.emit('data',{data:data});
    })

    socket.on('subscribe', function({roomId:room, name}, cb) { 
        console.log('joining room', room);
        socket.join(room); 
        var count = io.sockets.adapter.rooms[room].length;
        var error = false;
       
        if(!roomsDetails[room]) roomsDetails[room]=[];
        
        if(roomsDetails[room].includes(name)){
            userIndex = roomsDetails[room].indexOf(name)+1; // Existing user
        } else{
            userIndex = count;
            roomsDetails[room].push(name); // Updating Connected user per room
        }
        if(count !== roomsDetails[room].length){
            error = true;
        }

        const roomDetails = {
            error:error,
            count: count, 
            users: roomsDetails[room], 
            userIndex: userIndex
        };
        console.log('room.length', count, name, roomsDetails)
        cb(roomDetails); // Respond back total users in the group
        
        socket.broadcast.to(room).emit('newUserJoined', roomDetails);
        
    })

    socket.on('unsubscribe', function(room) {  
        console.log('leaving room', room);
        socket.leave(room); 
    })

    socket.on('start', function(data) {
        socket.broadcast.to(data.room).emit('start', data);
    });

    socket.on('send', function(data) {
        console.log('sending message');
        socket.broadcast.to(data.room).emit('message', data);
    });

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
});

const port = process.env.PORT || 4999;
server.listen(port, ()=>{
    console.log("App is listening in port: "+port);
})

app.use(express.static('client'))

app.get('/',(req,res)=>{
    res.sendFile(__dirname+'/client/index.html');
})

app.get('/game',(req,res)=>{
    res.sendFile(__dirname+'/client/game.html');
})

app.get('/create-room',(req,res)=>{
    res.sendFile(__dirname+'/client/create-room.html');
})

app.get('/create-room-submit',(req,res)=>{

    res.send({roomId: roomId+'-'+req.query.players});
    roomId++;
})

app.get('/join-room',(req,res)=>{
    // console.log(req.query)
    res.sendFile(__dirname+'/client/join-room.html');
})
