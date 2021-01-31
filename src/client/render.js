import constants from '../shared/constants'
import { play, updatePosition } from './networking';
import { getCurrentState } from './state'

var game;
var cursors;
var player = null;
var curPlayers = {};
var timeDisplay = "00:00";
let timeText = null;
function fmtMSS(s) {
    s = Math.floor(s);
    return (s - (s %= 60)) / 60 + (9 < s ? ':' : ':0') + s
}


export function playGame() {
    var config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 }
            }
        },
        scene: {
            init: init,
            preload: preload,
            create: create,
            update: update
        },
        pixelArt: true,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: constants.MAP_WIDTH,
            height: constants.MAP_HEIGHT,
        }

    };

    game = new Phaser.Game(config);
}

// Scene functions
function init() {

}

// 'this' refers to a scene object
function preload() {
    this.load.image('ground', 'assets/ground.svg');
    this.load.image('building1', 'assets/building1.png');
    this.load.image('wall1', 'assets/wall1.png');
    this.load.spritesheet('dog', 'assets/dog.gif', { frameWidth: 32, frameHeight: 20 });
    cursors = this.input.keyboard.createCursorKeys();
}

function spawnPlayer(scene, id, x, y) {
    let newPlayer = scene.physics.add.sprite(x, y, 'dog');
    newPlayer.setCollideWorldBounds(true);
    newPlayer.body.setSize(24, 5);
    newPlayer.body.setOffset(0, 15);
    scene.physics.add.collider(newPlayer, scene.walls);
    return newPlayer;
}

function buildWorld(scene) {
    scene.add.tileSprite(400, 300, 800, 600, 'ground');
    timeText = scene.add.text(700, 10, timeDisplay, { fontFamily: 'I-pixel-u', fontSize: '20px' });

    scene.walls = scene.physics.add.staticGroup();
    let b1 = scene.walls.create(200, 150, 'building1');
    b1.body.setSize(b1.width, 151);
    b1.body.setOffset(0, 0);
    let w1 = scene.walls.create(b1.x+b1.width/2, b1.y+b1.height/2, 'wall1');
    w1.setOrigin(0,0);
}

function create() {
    buildWorld(this);

    // this.physics.add.collider(player, somecollidergroup);

    this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNumbers('dog', { start: 0, end: 1 }),
        frameRate: 2,
        repeat: -1 // repeat infinitely
    });

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dog', { start: 8, end: 12 }),
        frameRate: 10,
        repeat: -1 // repeat infinitely
    });
}

function renderPlayers(scene) {
    // console.log('curPlayers', Object.keys(curPlayers).length);
    // console.log('players', players.length);

    let serverUpdate = getCurrentState();

    // spawn client player
    if (!player) {
        player = spawnPlayer(scene, serverUpdate.me.id, serverUpdate.me.x, serverUpdate.me.y);
    }

    // update remote players
    serverUpdate.others.forEach((player => {
        if (!(player.id in curPlayers)) {
            curPlayers[player.id] = spawnPlayer(scene, player.id, player.x, player.y);
        }
        let curPlayer = curPlayers[player.id];

        if (player.moving) {
            curPlayer.anims.play('left', true)
        } else {
            curPlayer.anims.play('idle', true);
        }

        curPlayers[player.id].setPosition(player.x, player.y);
        curPlayers[player.id].flipX = player.right;
    }));


    timeText.setText(fmtMSS(serverUpdate.timeRemaining));
}

function update() {
    // player.setVelocityX(0);
    // player.anims.play('idle', true);

    renderPlayers(this);

    var xmov = 0;
    var ymov = 0;

    if (cursors.left.isDown) {
        xmov = -1;
    }
    if (cursors.right.isDown) {
        xmov = 1;
    }
    if (cursors.down.isDown) {
        ymov = 1;
    }
    if (cursors.up.isDown) {
        ymov = -1;
    }

    var length = Math.sqrt(xmov * xmov + ymov * ymov);
    var xvel = 0;
    var yvel = 0;
    if (length > 0) {
        xvel = (xmov / length) * 200;
        yvel = (ymov / length) * 200;

        if (xmov == 1) player.flipX = true;
        else if (xmov == -1) player.flipX = false;
        player.anims.play('left', true);
    }
    else {
        player.anims.play('idle', true);
    }

    player.setVelocityX(xvel);
    player.setVelocityY(yvel);

    updatePosition({ x: player.x, y: player.y, right: player.flipX, moving: length > 0 });

}