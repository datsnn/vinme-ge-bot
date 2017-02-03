var request = require('request');
var WebSocket = require('ws');

var vg = {
    client: null,
    lastMessages: [],
    connected: false
};

vg.new = function(callback) {
    var time = Date.now();
    request({
        "method": "GET",
        "url": "http://s.vinme.ge/signalr/negotiate?connectionData=%5B%7B%22name%22%3A%22chathub%22%7D%5D&clientProtocol=1.3&_="+time,
    }, function(err, response) {
        if(err) {
            return callback(err);
        }

        if(response.statusCode != 200) {
            return callback("Status code: "+response.statusCode+" was expecting 200");
        }
        var token = JSON.parse(response.body).ConnectionToken;

        return callback(null, token);
    });
}

vg.search = function() {
    this.client.send('{"H":"chathub","M":"FindNext","A":["unknown","unknown"],"I":0}');
}

vg.sendMessage = function(message) {
    this.lastMessages.push(message);
    this.client.send('{"H":"chathub","M":"Send","A":["'+message+'"],"I":3}');
}

vg.startChat = function(token, start, newMessage) {
    var client = new WebSocket('ws://s.vinme.ge/signalr/connect?transport=webSockets&connectionToken='+encodeURIComponent(token)+'&connectionData=%5B%7B%22name%22%3A%22chathub%22%7D%5D&tid=8',{
      protocolVersion: 13,
      origin: 's.vinme.ge'
    }, {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36",
        "Upgrade": "websocket"
    });
    
    this.client = client;
    this.client.on('connectFailed', function(error) {
        console.log('Connect Error: ' + error.toString());
    });

    this.client.on('open', function() {
        console.log("Connected");
        vg.search();
    });

    this.client.on('close', function() {
        console.log("Connection closed!");
        process.exit();
    });

    this.client.on('message', function(message) {
        var json = JSON.parse(message);
        if(!json.M || !json.M[0] || !json.M[0].M) {
            return;
        }


        if(json.M[0].M == "pairConnected") {
            this.connected = true;
            console.log("Starting Chat, pair has connected!");
            start()
        }

        if(json.M[0].M == "addNewMessageToPage") {
            var us = false;
            if(vg.lastMessages.indexOf(json.M[0].A[1].message) > -1) {
                // console.log("US:")
                us = true;
            }

            newMessage(us, json.M[0].A[1].message);
        }

        if(json.M[0].M == 'pairDisconnected') {
            console.log(">>> Client disconnected!");
            vg.search();
        }

        if(this.connected == false && json.M[0].M == "noFreeUsers") {
            console.log("No free users, re-searching");
            vg.search();
        }

    });
}
module.exports = vg;
