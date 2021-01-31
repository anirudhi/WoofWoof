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
        if (!this.humanAssigned) {
            isHuman = true;
            this.humanAssigned = true;
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
        let dist = Math.sqrt(abs(p2.x - p1.x) + abs(p2.y - p1.y));
        if (dist < Constants.PLAYER_DIAMETER) {
            return true;
        } else {
            return false;
        }
    }

    update() {
        // Calculate time elapsed
        const now = Date.now();
        const dt = (now - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = now;

        // Update each player
        Object.keys(this.sockets).forEach(playerID => {
            const human = this.players[this.humanId];
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

    createUpdate(player) {
        return {
            t: Date.now(),
            me: player.serializeForUpdate(),
            others: Object.keys(this.players).filter(
                playerId => playerId != player.id
            ).map(
                playerId => this.players[playerId].serializeForUpdate()
            ),
            timeRemaining: this.getTimeElapsed(),
            captured: Object.keys(this.players).filter(playerId => {
                let player = this.players[playerId];
                return player.captured;
            }),
        };
    }
}

module.exports = Game;
