const io = require('socket.io').listen(5000);
const ioClient = require('socket.io-client');
const socketSwitch = ioClient.connect('http://localhost:8000', {reconnect: true});
const {exec} = require('child_process');

exec(`node device.js ${process.argv[2]}`, (err, stdout, stderr) => {});

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

//16. get answer message
socketSwitch.on('to client', data => {
    data = JSON.parse(data);
    console.log(data.message);

    //17. conversaiton between device and controller still going on
    setTimeout(() => {
        socketSwitch.emit('to switch', JSON.stringify({
            to: data.from,
            from: id.controllerId,
            message: 'Hello from controller'
        }));
    }, 3000);
});

io.on('connection', socket => {

    //2. get data from device and add controller address, move to switch server
    socket.on('init', data => {
        data = JSON.parse(data);
        data = Object.assign(data, {controllerId: id.controllerId});
        socketSwitch.emit('init', JSON.stringify(data));
    });

    //7. resolution to send message to device
    socketSwitch.on('ok', data => {
        const result = Object.assign(JSON.parse(data), {message: 'Hello from controller'});
        socketSwitch.emit('send', JSON.stringify(result)); //8. send message to switch server
    });

    socket.on('show', message => {
        message = JSON.parse(message);
        console.log(message.message);
    });

    socket.on('disconnect', () => {
        io.close();
    });
});
