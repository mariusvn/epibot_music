var Discord = require("discord.js");
var fs = require('fs');
var ytdl = require('ytdl-core');
var https = require('https');

var musicStream = null;
var dispatcher = null;

var text_channel = "290148144841490444";
var voice_channel = "274430776026726400";

var bot = new Discord.Client();
const token = "Mjk1MjAxNDEzMDExODY1NjAx.C7gPUg.r4h1VRFXAoxFyl15ZlE7BCbzXRo";


bot.on('ready', function () {
    console.log("Logged in as %s - %s\n", bot.user.username, bot.user.id);
    var channel = bot.channels.get(voice_channel).join().then(function (connection) {
        console.log("vocal joined");
        musicStream = connection;
    });
});

var commands = [{
        command: "ping",
        argNumber: 0,
        description: "send a message to test the bot",
        execute: function (message, args) {
            message.channel.sendMessage('pong');
        },
        usage: "!ping"
    },
    {
        command: "joinchannel",
        argNumber: 0,
        description: "bot join the vocal channel",
        execute: function (message, args) {
            var channel = bot.channels.get(voice_channel).join().then(function (connection) {
                console.log("vocal joined");
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
                            message.channel.sendMessage("Now playing: " + vid_name);
                            console.log("Now playing: " + vid_name)
                        })
                    }
                    https.request(options, callback).end();
                    //var vid_name = JSON.parse(xmlHttp.responseText);
                    //vid_name = vid_name.items.snippet.title;

                    if (dispatcher !== null) {
                        dispatcher.end();
                    }

                    //message.channel.sendMessage("Playing " + vid_name);

                    var stream = ytdl(args[0], {
                        filter: 'audioonly'
                    });
                    dispatcher = musicStream.playStream(stream, {
                        volume: 0.1
                    });
                } else {
                    message.channel.sendMessage("I'm not on a vocal channel");
                }
            } else {
                message.channel.sendMessage(args[0] + " is not a YouTube URL.");
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
                console.log(vol);
                dispatcher.setVolume(vol);
                console.log(dispatcher.volume);
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
            message.channel.sendMessage(result);
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
        message.channel.sendMessage("Unkown command, type !help to have a list of the commands");
    }

});

bot.login(token);