
var express = require('express');
var socket = require('socket.io');


var app = express();

app.use("/", express.static(__dirname));
app.get("/", function(req, res)
{
	res.sendFile("index.html");
});



var server = app.listen(5000, function () {
    console.log("le serveur démarre sur le port 5000 ....");

});//localhost:5000


var io = socket(server);
io.set('transports', ['websocket']);

var tanks = {};
io.on("connection", function (socket) {
    console.log("un joueur se connecte avec L'ID:: " + socket.id);
    socket.emit("ID", { id : socket.id });
    socket.on("heartbeat", function () {
        console.log("le Joueur avec L'ID " + socket.id + " envoi un heartbeat");

    });

    socket.on("Creation", function (data) {
        
        
        tanks[data.id] = data;
        socket.broadcast.emit("Ajout", data);
        
        for (key in tanks) {
            if (key == socket.id) continue;
            socket.emit("Ajout", tanks[key]);
        }
        
        
    });
    
    socket.on("JeBouge", function (data) {
        tanks[data.id] = data;
        socket.broadcast.emit("JoueurBouge", data);
        
    });

    socket.on("DeconnexionJoueur", function (data) {
        delete tanks[socket.id];
        socket.broadcast.emit("JoueurQuitte", { id : socket.id });
    });

});

