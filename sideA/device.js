const ioClient = require('socket.io-client');
const socketController = ioClient.connect('http://localhost:5000', {reconnect: true});
const socketSwitch = ioClient.connect('http://localhost:8000', {reconnect: true});

//1. gather all data in object and send to controller
socketSwitch.on('connect', () => {
    socketController.on('connect', () => {
        socketController.emit('init', JSON.stringify({
            deviceId: socketController.id,
            switchSocketId: socketSwitch.id,
            destination: process.argv[2]
        }));
    });
});

//11. get message from controller
socketSwitch.on('receive', data => {
    data = JSON.parse(data);
    socketController.emit('show', JSON.stringify({message: data.message})); //12. show message on own controller

    //13. send message back to switch
    socketSwitch.emit('to switch', JSON.stringify({
        to: data.controllerId,
        from: socketSwitch.id,
        message: 'Hello from device'
    }));
});

socketSwitch.on('to client', data => {
    data = JSON.parse(data);
    socketController.emit('show', JSON.stringify({message: data.message}));

    setTimeout(() => {
        socketSwitch.emit('to switch', JSON.stringify({
            to: data.from,
            from: socketSwitch.id,
            message: 'Hello from device'
        }));
    }, 2000);
});