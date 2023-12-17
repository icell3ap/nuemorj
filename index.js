const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)

const port = process.env.PORT || 3000;

app.use('/server-assets', express.static(__dirname + '/assets'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.get('/goat', (req, res) => {
    res.sendFile(__dirname + '/goatf.html')
})

var users_online = []
var osers = {}
var area_value_server = ''
// var area_value_server = ''
var divcount = 0

var msges = []

function arrayRemove(arr, value) { 

    return arr.filter(function(ele){ 
        return ele != value; 
    });
}

/* undefined:undefined
io.sockets.on('connection', function (socket) {
  var address = socket.handshake.address;
  console.log('New connection from ' + address.address + ':' + address.port);
});
*/

var greetings = [
    'Hola!', 
    'Send "s" to reveal a letter',
    'Send "e" to proceed to the next word',
]

var isrevealed = false

rooms = {}

var fs = require('fs');

filePath = "words.json"

var words = JSON.parse(fs.readFileSync(filePath));

// console.log(words)
// for some reason synonyms contains 2 arrays instead of 1
console.log(words['man']['synonyms'])

var wordsarr = []

for(var x in words) { // var x or just x
    // console.log(x)
    wordsarr.push(x)
}

console.log(wordsarr)
var wordslen = wordsarr.length
console.log(wordslen)
console.log(getRandomWord(wordslen))

function rint(lo = 0, hi) {
    return Math.floor(Math.random() * (hi - lo + 1)) + lo
}
function getRandomWord() {
    return wordsarr[Math.floor(Math.random() * (wordslen - 0))]
}

/*
for (let i = 0; i < 10; i++)
    if (getRandomWord(wordslen) == 'zone') {
        console.log('zoneeeee')
        console.log(words[getRandomWord(wordslen)]['synonyms'])
        break
    }
*/

function makeid(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

function newWord(room) {
    let w = getRandomWord()
    console.log(rooms)
    console.log(rooms[[room]]['cw'])
    rooms[[room]]['cw'] = w
    rooms[[room]]['rw'] = '_'.repeat(w.length)
    console.log(w)
    console.log(rooms[room])
    console.log(JSON.stringify(rooms), null, 4)
    console.log("CONSOLE.DIR")
    console.dir(rooms)

    // to all clients in a room including the sender
    io.in(room).emit('new-word', {[rooms[[room]]['rw']] : words[w]}, room)
}

    

io.on('connection', (socket) => {
    console.log('made socket connection with ID: ' + socket.id)
    // to rewrite
    users_online.push(socket.id)
    io.emit('user connected', users_online)
    // io.emit('area value and msges', area_value_server, msges)
    io.to(socket.id).emit('area-value-and-msges', area_value_server, msges)
    console.log('OBJECT.KEYS(SYROOMS) ' + Object.keys(rooms))
    io.emit('rooms', Object.keys(rooms))
    
    socket.on('disconnect', () => {
        console.log('disconnected ID: ' + socket.id)
        users_online = arrayRemove(users_online, socket.id)
        io.emit('user disconnected', users_online, socket.id)
        console.log(socket.id, users_online)

    })

    socket.on('disconnecting', () => {
        console.log(socket.rooms)
    })

    socket.on('chat message', (msg, room = '') => {
        // io.emit('chat message', msg) - to ALL users including sender
        // to all EXCEPT sender


        if (room === '') {
            socket.broadcast.emit('chat message', msg)
            msges.push(msg)
            console.log(msges)
        } else {
            socket.to(room).emit('chat message', msg)
        }
        console.log(socket.id + ' said: ' + msg)
    })

    socket.on('game-chat-msg', (msg, room) => {
        msg = msg.toLowerCase()
        if (msg == 's')
        {
            console.log('REVEALING A LETTER')
            // let rin = 127
            // while
            let cwd = rooms[[room]]['cw']
            let olrw = rooms[[room]]['rw']

            if (cwd != olrw)
            {
                let rin = rint(0, cwd.length - 1)
                while (olrw[rin] != '_')
                {
                    rin = rint(0, cwd.length - 1)
                }
                console.log(rin)
                console.log(olrw.slice(0, rin))
                console.log(cwd[rin])
                console.log(olrw.slice(rin, cwd.length))
                let newrw = olrw.slice(0, rin) + cwd[rin] + olrw.slice(rin + 1, cwd.length)
                //rooms[[room]]['rw'] = 
                rooms[[room]]['rw'] = newrw
                io.to(room).emit('reveal', newrw)
                socket.to(room).emit('audio', 'hurt')
            }
            else
            {
                if (!isrevealed) {
                    isrevealed = true
                    io.to(room).emit('fully-revealed', true)
                }
                console.log('NOTHING TO REVEAL')

            }
        }
        else if (msg == 'e')
        {
            newWord(room)
            socket.to(room).emit('audio', 'boom')
            //io.to(room).emit('show-word',)
        }
        else if (msg == 'yamete') {
            socket.to(room).emit('audio', 'ymte')
        }
        else if (msg == rooms[[room]]['cw'].toLowerCase())
        {
            console.log('GAMECHATCORRECT')
            io.to(room).emit('game-chat-correct', msg, osers[[socket.id]]['username'])
            let rintt = rint(0,3)
            console.log("RINTT ", rintt)
            io.to(room).emit('audio', 'meows', rintt)
            // newWord(room)
            isrevealed = true
            io.to(room).emit('fully-revealed', true)
            
            console.log('GAMECHATCORRECT22222')
        }
        else {
            console.log(msg)
            socket.to(room).emit('game-chat-back', msg, osers[[socket.id]]['username'])
            socket.to(room).emit('audio', 'hitmarker')
        }
    })

    socket.on('join-room', (room, cb) => {
        socket.join(room)
        cb(`Joined "${room}"`)
        //socket.to(room).emit('audio', 'hallway')
    })

    socket.on('join-game', (room, cb) => {
        socket.join(room)
        rooms[[room]]['users'][[socket.id]] = {"username" : osers[[socket.id]]['username']}
        console.log(rooms)
        let curwd = rooms[[room]]['cw']
        let rewd = rooms[[room]]['rw']
        cb({ [rewd] : words[curwd] }, greetings, isrevealed)
        
        socket.to(room).emit('game-chat-back', `${osers[[socket.id]]['username']} connected`)
        socket.to(room).emit('audio', 'cave')
    })

    socket.on('area-value', (area_value) => {
        // broadcast? can i? yeah i can now
        area_value_server = area_value
        console.log(area_value)
        socket.broadcast.emit('area-value', area_value)
    })

    socket.on('divc-change', (dif) => {
        divcount += dif
        console.log('divc has been clicked ' + divcount + ' times')
        io.emit('divc-change', divcount)
        socket.broadcast.emit('audio', 'bruh')
    })

    socket.on('get dir', () => {
        console.log('dir name ' + __dirname)
        socket.emit('get dir', __dirname)
    })

    // cb ?
    socket.on('new-game', () => {
        let room = makeid(5)
        socket.join(room)
        rooms[room] = { "users" : { [socket.id] : {"username" : osers[[socket.id]]['username']}}, "cw" : 'HHHHHHHHHHHHHH' }
        newWord(room)
        io.emit('rooms', Object.keys(rooms))
        console.log('new-game\\n')
        console.log(rooms)
        console.log(rooms[room])

        // socket.to(room).emit('')
    })

    socket.on('auth', (username, cb) => {
        if (username) {
            osers[[socket.id]] = { ['username'] : username } 
        }
        else {
            osers[[socket.id]] = { ['username'] : socket.id.slice(0, 3) } 
        }
        cb([[socket.id]]['username'])
        console.log(osers)
    })

})

/*
io.on('connection', (socket2) => {
    console.log('a user connected 22')
    
    socket2.on('disconnect', () => {
        console.log('user disconnected 22')
    })

    socket2.on('chat message', (msg) => {
        io.emit('chat message', msg)
        console.log('message22: ' + msg)
    })
})
*/



server.listen(port, () => {
    console.log(`Socket.IO server running at http://localhost:${port}/`);
})