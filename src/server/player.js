class Player {
    constructor(id, username, isHuman, x, y) {
        this.id = id;
        this.username = username;
        this.x = x;
        this.y = y;
        this.isHuman = isHuman
    }

    serializeForUpdate() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            isHuman: this.isHuman,
        };
    }

    setPosition(pos) {
        this.x = pos.x;
        this.y = pos.y;
    }
}

module.exports = Player;