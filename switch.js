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
    //3. get data and register on switch
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

            //4. show available id addresses in terminal
            let list = await Device.find().select({id: 1}),
                arr = [];

            list.map(elem => {
                arr.push(elem.id);
            });

            console.log('Available addresses: ');
            arr.forEach(elem => {
                console.log(elem);
            });

            // 5. Check if device with ID is exist
            const deviceDest = await Device.findOne({id: data.destination});

            if(!deviceDest) {
                return io.to(socket.id).emit('feedback', JSON.stringify({message: 'Device with given ID is not found.'}));
            } else {
                io.to(socket.id).emit('feedback', JSON.stringify({message: `Connected to device: ${data.destination}`}));
                io.to(socket.id).emit('ok', JSON.stringify(data)); //6. feedback to controller: "everything good, can send message"
            }
        } catch(error) {
            console.log('Error: ' + error.message);
        }
    });

    socket.on('message', message => {
        message = JSON.parse(message);
        console.log(message.message);
    });

    //9. get message from controller
    socket.on('send', data => {
        data = JSON.parse(data);
        io.to(data.destination.slice(-20)).emit('receive', JSON.stringify(data)); //10. move message to chosen device
    });

    //14. get message from device
    socket.on('to switch', data => {
        data = JSON.parse(data);
        // 15. move answer messege back to controller
        io.to(data.to).emit('to client', JSON.stringify(data));
    });

    socket.on('disconnect', async () => {
        try {
            await Device.find()
                .or([{controllerId: socket.io}, {switchSocketId: socket.id}])
                .remove();
        } catch(error) {
            console.log('Error: ' + error.message);
        }
    });
});
