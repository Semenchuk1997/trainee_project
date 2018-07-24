const ioClient = require('socket.io-client');
const socketController = ioClient.connect('http://localhost:6000', {reconnect: true});
const socketSwitch = ioClient.connect('http://localhost:8000', {reconnect: true});

const express = require('express');
const app = express();

socketSwitch.on('connect', () => {
    socketController.on('connect', () => {
      socketController.emit('init', JSON.stringify({
          deviceId: socketController.id,
          switchSocketId: socketSwitch.id,
          destination: process.argv[2]
      }));
    });
});

socketController.on('ok from switch', data => {
    data = JSON.parse(data);

    // socketController.emit('ok from device', JSON.stringify({message: "device can sending a messages"}));

    setInterval(() => {
        socketSwitch.emit('send', JSON.stringify({id: data.id, message: 'Hello from device B'}));
    }, 2000);
});

socketSwitch.on('receive', data => {
    data = JSON.parse(data);
    socketController.emit('show', JSON.stringify({message: data.message}));
    // setInterval(() => {
    //     socketSwitch.emit('send', JSON.stringify({id: data.from, message: 'Hello from device A'}));
    // }, 2000);
});

app.listen(4000);