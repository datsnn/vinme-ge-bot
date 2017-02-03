var vg = require(__dirname+"/Class/VinmeGe.js");
var readline = require('readline');
var async = require('async');
var fs = require('fs');
var colors = require('colors');
var messages = {};

fs.readFile(__dirname+'/messages.json', 'utf8', function(err, data) {
    messages = JSON.parse(data);
});

vg.new(function(err, token) {
    vg.startChat(token, startChat, newMessage);
});

function startChat() {
    console.log("Everything is ok, chatting...");
}

function newMessage(fromUs, message) {
    var found = false;

    if(fromUs) {
        console.log("Bot: ", message.red);
    } else {
        
        console.log("Vinme: ", message.green);

        for (var question in messages.pairs) {
            if (isPartOf(message, question)) {
                vg.sendMessage(randEl(messages.pairs[question]));
                found = true;
                break;
            }
        }

        if(!found) {
            vg.sendMessage(randEl(messages.defaults));
        }
    }
}

function isPartOf(string, part) {
    return string.toLowerCase().split(" ").join("").indexOf(part.toLowerCase().split(" ").join("")) > -1;
}

function randEl(arr) {
    return arr[Math.floor(Math.random()*arr.length)];
}

async.forever(function(next) {
    try {

        var text = fs.readFileSync(__dirname+'/message.txt').toString();
        
        fs.unlink(__dirname+'/message.txt', function() {
            if(text) {
                vg.sendMessage(text);        
            }
        });
    } catch(e) {

    }

    setTimeout(next, 1000);
});