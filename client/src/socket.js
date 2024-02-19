import {io} from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempt: 'Infinity',
        timeout: 10000,
        transports: ['websocket'],
    };
    return io("http://localhost:9000", options);
    // backend url to connect
    //REACT_APP_ is must if we don't install dotenv
};