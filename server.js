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
        try{
            if(!roomsDetails[room]) {
                cb({error:true, message:"Room not created"})
                return;
            }
            console.log('joining room', room);
            socket.join(room); 
    
            var count = io.sockets.adapter.rooms[room].length;
            var error = false;
            var userIndex;
           
            // if(!roomsDetails[room]) roomsDetails[room]={
            //     users: [],
            //     history: [],
            //     lastCommunicated:{}
            // }
            
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
        } catch(e){
            console.log('error: subscribe', e)
        }
        
    })

    socket.on('unSubscribe', function({roomId, playersName}) {  
        socket.leave(roomId); 
        socket.broadcast.to(roomId).emit('someOneLeft', playersName);
    })

    // socket.on('keepAlive', function({user, room}) {  
    //     console.log( user + ' is alive in room: '+room); 
    //     if(roomsDetails[room])
    //         roomsDetails[room].lastCommunicated[user] = moment().valueOf();
    // })

    socket.on('start', function(data) {
        socket.broadcast.to(data.room).emit('start', data);
        roomsDetails[data.room].gameStarted = true;
    });

    socket.on('playerClickedOneCell', function(data, ack) {
        try{
            console.log('sending message');
            roomsDetails[data.room].history.push(data.message);
            roomsDetails[data.room].lastCommunicated = moment().valueOf();
            ack({status:'success', message:'Received in server'})
            data.historySequence = roomsDetails[data.room].history.length;
            socket.broadcast.to(data.room).emit('playerClickedOneCell', data);
        } catch(e){
            console.log('error: playerClickedOneCell', e)
        }
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

    socket.on('nextPlayer',function(data){
        socket.broadcast.to(data.roomId).emit('nextPlayer', data.playerId);
    })

    socket.on('gameOver', function({roomId, winner}, ack){
        socket.broadcast.to(roomId).emit('gameOver', {winner});
        ack("received in server");
        delete roomsDetails[roomId];
        console.log('gameOver');
        socket.leave(roomId); 
    });
});

const port = process.env.PORT || 4999;
server.listen(port, ()=>{
    console.log("App is listening in port: "+port);
})

app.use(express.static('build'))

app.get('/create-room-submit',(req,res)=>{

    if(!roomsDetails[roomId]) roomsDetails[roomId+'-'+req.query.players]={
        users: [],
        history: [],
        lastCommunicated:moment().valueOf(),
        owner: req.query.name,
    }
    res.send({roomId: roomId+'-'+req.query.players});
    roomId++;
})

app.get('/is-room-exist',(req,res)=>{
    const roomExist = !!roomsDetails[req.query.roomId];
    const userExist = roomExist ? roomsDetails[req.query.roomId].owner===req.query.name ||roomsDetails[req.query.roomId].users.includes(req.query.name) : false;
    let message = "success";
    if(userExist) 
        message = req.query.name+' is already joined the group, use another name';
    else if (!roomExist)
        message = "Room ID: "+req.query.roomId+' does not exist';
    if (roomsDetails[req.query.roomId] && roomsDetails[req.query.roomId].gameStarted){
        message="Game already started. Try again"
    }
    res.send({status: roomExist && !userExist && !roomsDetails[req.query.roomId].gameStarted , message });
})

app.get('*',(req,res)=>{
    res.sendFile(__dirname+'/build/index.html');
})