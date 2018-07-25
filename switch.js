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
    try{
        await Device.find().remove();
    } catch(error) {
        console.log('Error: ' + error.message);
    }
})();

io.on('connection', socket => {
    socket.on('init', async data => {
        data = JSON.parse(data);

        try {
            const device = await Device({
                id: data.deviceId + data.controllerId + data.switchSocketId,
                deviceId: data.deviceId,
                switchSocketId: data.switchSocketId,
                controllerId: data.controllerId,
                destination: data.destination
            });
            await device.save();

            //console.log('allow device: ' + await Device.find().select({id: 1}));

            const deviceDest = await Device.findOne({id: data.destination});

            if(!deviceDest) {
                return io.to(socket.id).emit('feedback', JSON.stringify({message: 'Device with given ID is not found.'}));
            } else {
                io.to(socket.id).emit('feedback', JSON.stringify({message: `Connected to device: ${data.destination}`}));
                io.to(socket.id).emit('ok', JSON.stringify(data));
            }
        } catch(error) {
            console.log('Error: ' + error.message);
        }
    });

    socket.on('message', message => {
        message = JSON.parse(message);
        console.log(message.message);
    });

    socket.on('send', data => {
        io.to(data.destination.slice(-20)).emit('receive', JSON.stringify(data));
    });

    socket.on('to switch', data => {
        data = JSON.parse(data);

        io.to(data.to).emit('to client', JSON.stringify(data));
    });

    // socket.on('test', test => {
    //     console.log(test)
    // });

    socket.on('disconnect', async () => {
        try {
            await Device.find({controllerId: socket.io}).remove();
        } catch(error) {
            console.log('Error: ' + error.message);
        }
    });
});
