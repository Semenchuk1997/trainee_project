const io = require('socket.io').listen(6000);
const ioClient = require('socket.io-client');
const socketSwitch = ioClient.connect('http://localhost:8000', {reconnect: true});
const {exec} = require('child_process');

exec(`node ../device/device.js ${process.argv[2]}`, (err, stdout, stderr) => {
    console.log(stdout);
});

const id = {
    deviceId: null,
    controllerId: null
}

socketSwitch.on('connect', () => {
    socketSwitch.emit('message', JSON.stringify({message: 'Controller A connected ot switch.'}));
    id.controllerId = socketSwitch.id;
});

socketSwitch.on('feedback', message => {
    console.log(JSON.parse(message).message);
});

io.on('connection', socket => {
    socket.on('init', data => {
        data = JSON.parse(data);
        socketSwitch.emit('init', JSON.stringify(Object.assign(data, {controllerId: id.controllerId})));
    });

    socket.on('ok from device', message => {
        console.log(JSON.parse(message).message);
    });

    socketSwitch.on('ok', data => {
        //io.to(JSON.parse(data).deviceId).emit('ok from switch');
        socket.emit('ok from switch', data);
    });

    socket.on('show', message => {
        console.log(JSON.parse(message).message);
    });
});
