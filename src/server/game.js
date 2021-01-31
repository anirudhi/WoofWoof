const { abs } = require('prelude-ls');
const Constants = require('../shared/constants');
const Player = require('./player');
// const applyCollisions = require('./collisions');

class Game {
    constructor() {
        this.sockets = {};
        this.players = {};
        this.lastUpdateTime = Date.now();
        this.gameStartTime = null;
        this.shouldSendUpdate = false;
        this.humanAssigned = false;
        this.humanId = null;
        setInterval(this.update.bind(this), 1000 / 60);
    }

    addPlayer(socket, username) {
        this.sockets[socket.id] = socket;
        console.log('Added Player with id:', socket.id);

        // Generate a position to start this player at.
        const x = Constants.MAP_WIDTH * (0.25 + Math.random() * 0.5);
        const y = Constants.MAP_HEIGHT * (0.25 + Math.random() * 0.5);
        let isHuman = false;
        if (Object.keys(this.players).length === 0) {
            isHuman = true;
            this.humanId = socket.id;
            this.gameStartTime = Date.now();
        }
        this.players[socket.id] = new Player(socket.id, username, isHuman, x, y);
    }

    removePlayer(socket) {
        delete this.sockets[socket.id];
        delete this.players[socket.id];
    }

    handleInput(socket, pos) {
        if (this.players[socket.id]) {
            this.players[socket.id].setPosition(pos);
        }
    }

    checkCollision(p1, p2) {
        if (p1 && p2) {
            let dist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
            if (dist < Constants.PLAYER_DIAMETER) {
                return true;
            } else {
                return false;
            }
        }
        return false;
    }

    update() {
        // Calculate time elapsed
        const now = Date.now();
        const dt = (now - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = now;

        // Update each player
        const human = this.players[this.humanId];
        Object.keys(this.sockets).forEach(playerID => {
            const player = this.players[playerID];
            if (this.checkCollision(human, player) && (playerID != this.humanId)) {
                player.setCaptured();
            }
        });

        if (this.getTimeElapsed <= 0) {
            // gameover
            console.log("game over");
        }

        // Send a game update to each player every other time
        if (this.shouldSendUpdate) {
            Object.keys(this.sockets).forEach(playerID => {
                const socket = this.sockets[playerID];
                const player = this.players[playerID];
                socket.emit(Constants.MSG_TYPES.GAME_UPDATE, this.createUpdate(player));
            });
            this.shouldSendUpdate = false;
        } else {
            this.shouldSendUpdate = true;
        }
    }

    getTimeElapsed() {
        let secs = (Date.now() - this.gameStartTime) / 1000;
        return Constants.GAME_DURATION - secs;
    }

    getCaptured() {
        return Object.keys(this.players).filter(playerId => {
            let player = this.players[playerId];
            return player.captured;
        }).map(player => { return player.username });
    }

    createUpdate(player) {
        return {
            t: Date.now(),
            humanId: this.humanId,
            me: player.serializeForUpdate(),
            others: Object.keys(this.players).filter(
                playerId => playerId != player.id
            ).map(
                playerId => this.players[playerId].serializeForUpdate()
            ),
            timeRemaining: this.getTimeElapsed(),
            captured: this.getCaptured(),
        };
    }
}

module.exports = Game;
