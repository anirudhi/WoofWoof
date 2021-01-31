import { throttle } from 'throttle-debounce';
import io from 'socket.io-client';
// import { updatePlayers } from './render';
import { processGameUpdate } from './state'

const Constants = require('../shared/constants');

const socket = io(`ws://${window.location.host}`);
// resolves once connection established
const connectedPromise = new Promise(resolve => {
    socket.on('connect', () => {
        console.log('Connected to server!');
        resolve();
    });
});

export const connect = onGameOver => (
    connectedPromise.then(() => {
        // Register callbacks
        socket.on(Constants.MSG_TYPES.GAME_UPDATE, processGameUpdate);
        socket.on(Constants.MSG_TYPES.GAME_OVER, onGameOver);
    })
);

export const play = username => {
    socket.emit(Constants.MSG_TYPES.JOIN_GAME, username);
};

export const updatePosition = throttle(20, pos => {
    socket.emit(Constants.MSG_TYPES.INPUT, pos);
});