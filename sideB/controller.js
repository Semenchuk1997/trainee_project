const io = require('socket.io').listen(6666);
const ioClient = require('socket.io-client');
const socketSwitch = ioClient.connect('http://localhost:8000', {reconnect: true});
const {exec} = require('child_process');

exec(`node device.js ${process.argv[2]}`, (err, stdout, stderr) => {});

const id = {
    deviceId: null,
    controllerId: null
}

socketSwitch.on('connect', () => {
    socketSwitch.emit('message', JSON.stringify({message: 'Controller B connected ot switch.'}));
    id.controllerId = socketSwitch.id;
});

socketSwitch.on('feedback', message => {
    console.log(JSON.parse(message).message);
});

socketSwitch.on('to client', data => {
    data = JSON.parse(data);
    console.log(data.message);

    setTimeout(() => {
        socketSwitch.emit('to switch', JSON.stringify({
            to: data.from,
            from: id.controllerId,
            message: 'Hello from controller'
        }));
    }, 3000);
});

io.on('connection', socket => {
    socket.on('init', data => {
        data = JSON.parse(data);
        data = Object.assign(data, {controllerId: id.controllerId});
        socketSwitch.emit('init', JSON.stringify(data));
    });

    socketSwitch.on('ok', data => {
        const result = Object.assign(JSON.parse(data), {message: 'Hello from controller'});
        socketSwitch.emit('send', JSON.stringify(result));
    });

    socket.on('show', message => {
        message = JSON.parse(message);
        console.log(message.message);
    });

    socket.on('disconnect', () => {
        io.close();
    });
});
