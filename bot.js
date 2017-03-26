/*
    Code by Marius Van Nieuwenhuyse 
    Modification interdite sans authorisation
*/

var Discord = require("discord.js");
var fs = require('fs');
var ytdl = require('ytdl-core');
var https = require('https');

var musicStream = null;
var dispatcher = null;
var globalVolume = 0.2;

var text_channel = "290148144841490444";
var voice_channel = "274430776026726400";

var bot = new Discord.Client();
const token = "Mjk1MjAxNDEzMDExODY1NjAx.C7gPUg.r4h1VRFXAoxFyl15ZlE7BCbzXRo";

var queue = [];
var now = null;


bot.on('ready', function () {
    console.log("Logged in as %s - %s\n", bot.user.username, bot.user.id);
    var channel = bot.channels.get(voice_channel).join().then(function (connection) {
        console.log(bot.channels.get(voice_channel).name + " channel joined");
        musicStream = connection;
    });
});

function findCommand(comm) {
    for (var i = 0; i < commands.length; i++) {
        if (commands[i].command == comm) {
            return commands[i];
        }
    }
    return null;
}

function next() {
    now = null;
    var next = queue.shift();
    if(next === null || next === undefined){
        return;
    }
    var play = findCommand('play');
    if (play === null) {
        return;
    }
    play.execute(null, [next]);
}

var commands = [{
        command: "ping",
        argNumber: 0,
        description: "send a message to test the bot",
        execute: function (message, args) {
            bot.channels.get(text_channel).sendMessage('pong');
        },
        usage: "!ping"
    },
    {
        command: "joinchannel",
        argNumber: 0,
        description: "bot join the vocal channel",
        execute: function (message, args) {
            var channel = bot.channels.get(voice_channel);
            channel.join().then(function (connection) {
                console.log(bot.channels.get(voice_channel).name + " channel joined");
                musicStream = connection;
            });
        },
        usage: "!joinchannel"
    },
    {
        command: "play",
        argNumber: 1,
        description: "play a music",
        execute: function (message, args) {
            var regex = /^(https?\:\/\/)?((www|m)\.youtube\.com|youtu\.?be)\/.+$/g;
            if (regex.test(args[0])) {
                if (musicStream !== null) {

                    var vid_id = args[0].split('v=')[1];
                    var apos = vid_id.indexOf('&');
                    if (apos != -1) {
                        vid_id = vid_id.substring(0, apos);
                    }
                    var options = {
                        host: "www.googleapis.com",
                        path: "/youtube/v3/videos?id=" + vid_id + "&part=snippet&key=AIzaSyDm71ZB6xmrzkt5ERLYQPoK2-CFecbx3iM"
                    }
                    var callback = function (res) {
                        var str = "";
                        res.on('data', function (chunk) {
                            str += chunk;
                        });
                        res.on('end', function () {
                            var vid_name = JSON.parse(str);
                            vid_name = vid_name.items[0].snippet.title;
                            bot.channels.get(text_channel).sendMessage("Now playing: " + vid_name);
                            console.log("Now playing: " + vid_name)
                            now = {vid_name: vid_name, vid_id: vid_id};
                        })
                    }
                    https.request(options, callback).end();

                    if (dispatcher !== null) {
                        dispatcher.end('anorthe music playing');
                    }

                    var stream = ytdl(args[0], {
                        filter: 'audioonly',
                        quality: 250
                    });
                    dispatcher = musicStream.playStream(stream, {
                        volume: globalVolume
                    });
                    dispatcher.on('end', function(reason){next();});
                } else {
                    bot.channels.get(text_channel).sendMessage("I'm not on a vocal channel");
                }
            } else {
                bot.channels.get(text_channel).sendMessage(args[0] + " is not a YouTube URL.");
            }
        },
        usage: "!play <YouTube Link>"
    },
    {
        command: "stop",
        argNumber: 0,
        description: "stop the music (cannot resume)",
        execute: function (message, args) {
            if (dispatcher !== null) {
                dispatcher.end();
            }
        },
        usage: "!stop"
    },
    {
        command: "volume",
        argNumber: 1,
        description: "set the volume of the music",
        execute: function (message, args) {
            if (dispatcher !== null) {
                var vol = parseFloat(args[0]);
                dispatcher.setVolume(vol);
                globalVolume = vol;
            }
        },
        usage: "!volume <volume [defaut: 0.1]>"
    },
    {
        command: "pause",
        argNumber: 0,
        description: "pause the music",
        execute: function (message, args) {
            if (dispatcher !== null) {
                dispatcher.pause();
            }
        },
        usage: "!pause"
    },
    {
        command: "resume",
        argNumber: 0,
        description: "resume the music",
        execute: function (message, args) {
            if (dispatcher !== null) {
                dispatcher.resume();
            }
        },
        usage: "!resume"
    },
    {
        command: "queue",
        argNumber: 2,
        description: "moderate the playlist",
        execute: function (message, args) {
            var play = findCommand("play");
            if (args[0] === "add") {
                var regex = /^(https?\:\/\/)?((www|m)\.youtube\.com|youtu\.?be)\/.+$/g;
                if (regex.test(args[1])) {
                    if (dispatcher === null) {
                        //no playing music
                        play.execute(message, [args[1]]);
                    } else {
                        queue.push(args[1]);

                        var vid_id = args[1].split('v=')[1];
                        var apos = vid_id.indexOf('&');
                        if (apos != -1) {
                            vid_id = vid_id.substring(0, apos);
                        }
                        var options = {
                            host: "www.googleapis.com",
                            path: "/youtube/v3/videos?id=" + vid_id + "&part=snippet&key=AIzaSyDm71ZB6xmrzkt5ERLYQPoK2-CFecbx3iM"
                        }
                        var callback = function (res) {
                            var str = "";
                            res.on('data', function (chunk) {
                                str += chunk;
                            });
                            res.on('end', function () {
                                var vid_name = JSON.parse(str);
                                vid_name = vid_name.items[0].snippet.title;
                                bot.channels.get(text_channel).sendMessage("Added to playlist: " + vid_name);
                                console.log("Added to playlist: " + vid_name);
                            });
                        }
                        https.request(options, callback).end();
                    }
                }
            } else if (args[0] === "next") {
                var regex = /^(https?\:\/\/)?((www|m)\.youtube\.com|youtu\.?be)\/.+$/g;
                if (regex.test(args[1])) {
                    if (dispatcher === null) {
                        play.execute(message, [args[1]]);
                    } else {
                        queue.unshift(args[1]);

                        var vid_id = args[1].split('v=')[1];
                        var apos = vid_id.indexOf('&');
                        if (apos != -1) {
                            vid_id = vid_id.substring(0, apos);
                        }
                        var options = {
                            host: "www.googleapis.com",
                            path: "/youtube/v3/videos?id=" + vid_id + "&part=snippet&key=AIzaSyDm71ZB6xmrzkt5ERLYQPoK2-CFecbx3iM"
                        }
                        var callback = function (res) {
                            var str = "";
                            res.on('data', function (chunk) {
                                str += chunk;
                            });
                            res.on('end', function () {
                                var vid_name = JSON.parse(str);
                                vid_name = vid_name.items[0].snippet.title;
                                bot.channels.get(text_channel).sendMessage("Added next to playlist: " + vid_name);
                                console.log("Added next to playlist: " + vid_name);
                            });
                        }
                        https.request(options, callback).end();
                    }
                }
            }
        },
        usage: "!queue <add|next> [YouTube link]\nNote: next is to set the music that\n   will be played just after the music who\n   is now playing."
    },
    {
        command: "clearqueue",
        argNumber: 0,
        description: "clear the playlist",
        execute: function(message, args){
            queue = [];
        },
        usage: "!clearqueue"
    },
    {
        command: "now",
        argNumber: 0,
        description: "show the title of the music",
        execute: function(message, args){
            if(now !== null){
                bot.channels.get(text_channel).sendMessage("Playing now: " + now.vid_name);
            }else{
                bot.channels.get(text_channel).sendMessage("No music playing ...");
            }
        }
    },
    {
        command: "help",
        argNumber: 0,
        description: "list of the commands",
        execute: function (message, args) {
            var result = "```";
            commands.forEach(function (comm) {
                result += "-------------------------------------------------\n";
                result += "Command name: " + comm.command + "\n";
                result += "Description: " + comm.description + "\n";
                result += "Usage: " + comm.usage + "\n";
            }, this);
            result += "```";
            bot.channels.get(text_channel).sendMessage(result);
        },
        usage: "!help"
    }
];

bot.on('message', message => {
    if (message.channel.id != text_channel) {
        return;
    }
    var msg = message.content.split(" ");
    var ar = [];
    for (var i = 1; i < msg.length; i++) {
        ar.push(msg[i]);
    }
    var found = false;
    commands.forEach(function (comm) {
        if (msg[0] === "!" + comm.command && msg.length == (comm.argNumber + 1)) {
            comm.execute(message, ar);
            found = true;
        }
    }, this);
    if (message.content.substring(0, 1) === "!" & !found) {
        bot.channels.get(text_channel).sendMessage("Unkown command, type !help to have a list of the commands");
    }

});

bot.login(token);