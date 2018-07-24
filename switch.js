const mongoose = require('mongoose');
const io = require('socket.io').listen(8000);

mongoose.connect('mongodb://localhost:27017/devices', {useNewUrlParser: true})
    .then(() => console.log('Connected to mongoDB...'))
    .catch(error => console.log('Could not connect to mongoDB...', error));

const Device = mongoose.model('Devices', new mongoose.Schema({
    id: String,
    deviceId: String,
    switchSocketId: String,
    controllerId: String,
    destination: String
}));

(async () => {
    await Device.find().remove();
})();

io.on('connection', socket => {
    socket.on('init', async data => {
        data = JSON.parse(data);

        const device = await Device({
            id: data.deviceId + data.controllerId + data.switchSocketId,
            deviceId: data.deviceId,
            switchSocketId: data.switchSocketId,
            controllerId: data.controllerId,
            destination: data.destination
        });
        await device.save();

        const deviceDest = await Device.findOne({id: data.destination});

        if(!deviceDest) {
            return io.to(socket.id).emit('feedback', JSON.stringify({message: 'Device with given ID is not found.'}));
        } else {
            io.to(socket.id).emit('feedback', JSON.stringify({message: `Connected to device: ${data.destination}`}));
            io.to(socket.id).emit('ok', JSON.stringify({id: deviceDest.id}));
        }
    });

    socket.on('send', data => {
        data = Object.assign({}, JSON.parse(data));
        const address = data.id.slice(-20);

        io.to(address).emit('receive', JSON.stringify({
            from: address,
            message: data.message
        }));
    });

    socket.on('message', message => {
        console.log(JSON.parse(message).message);
    });

    socket.on('disconnect', async () => {
        await Device.find({controllerId: socket.io}).remove();
    });
});