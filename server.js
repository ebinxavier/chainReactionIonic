const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const cors = require('cors');
const moment = require('moment');


app.use(cors())

let roomId = 1167;

const roomsDetails = {}
// const colors = ['red', 'green', 'blue', 'yellow', 'pink', 'orange', 'cyan', 'lightgreen'];


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

        var roomObj = io.sockets.in(room);
        roomObj.on('join', function() {
          console.log("Someone joined the roomObj.");
        });

        roomObj.on('leave', function() {
          console.log("Someone left the room.");
        });

        var count = io.sockets.adapter.rooms[room].length;
        var error = false;
        var userIndex;
       
        if(!roomsDetails[room]) roomsDetails[room]={
            users: [],
            history: [],
            lastCommunicated:{}
        }
        
        if(roomsDetails[room].users.includes(name)){
            userIndex = roomsDetails[room].users.indexOf(name)+1; // Existing user
        } else{
            userIndex = count;
            roomsDetails[room].users.push(name); // Updating Connected user per room
        }
        if(count !== roomsDetails[room].users.length){
            error = true;
        }

        const roomDetails = {
            error:error,
            count: count, 
            users: roomsDetails[room].users, 
            userIndex: userIndex,
            historySequence : roomsDetails[room].history.length
        };
        console.log('room.length', count, name, roomsDetails)
        cb(roomDetails); // Respond back total users in the group
        
        socket.broadcast.to(room).emit('newUserJoined', roomDetails);
        
    })

    socket.on('unSubscribe', function({roomId, playersName}) {  
        console.log('leaving room', roomId, playersName);
        socket.leave(roomId); 
        socket.broadcast.to(roomId).emit('someOneLeft', playersName);
    })

    socket.on('keepAlive', function({user, room}) {  
        console.log( user + ' is alive in room: '+room); 
        if(roomsDetails[room])
            roomsDetails[room].lastCommunicated[user] = moment().valueOf();
    })

    socket.on('start', function(data) {
        socket.broadcast.to(data.room).emit('start', data);
    });

    socket.on('playerClickedOneCell', function(data, ack) {
        console.log('sending message');
        roomsDetails[data.room].history.push(data.message);
        console.log('history', roomsDetails[data.room].history)
        ack({status:'success', message:'Received in server'})
        data.historySequence = roomsDetails[data.room].history.length;
        socket.broadcast.to(data.room).emit('playerClickedOneCell', data);
    });

    socket.on('getHistoryCount', function({roomId}, response){
        response(roomsDetails[roomId]?roomsDetails[roomId].history.length:0);
    })

    socket.on('getHistory', function({roomId}, response){
        response(roomsDetails[roomId]?roomsDetails[roomId].history:[]);
    })

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
});

const port = process.env.PORT || 4999;
server.listen(port, ()=>{
    console.log("App is listening in port: "+port);
})

app.use(express.static('client'))

app.get('/create-room-submit',(req,res)=>{

    res.send({roomId: roomId+'-'+req.query.players});
    roomId++;
})
