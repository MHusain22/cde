import {io} from 'socket.io-client';
import API_URL from './util/backend';

export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempt: 'Infinity',
        timeout: 10000,
        transports: ['websocket'],
    };
    return io(API_URL, options);
    // backend url to connect
    //REACT_APP_ is must if we don't install dotenv
};