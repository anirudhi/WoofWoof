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

function loadbuildings(scene, names) {
    names.forEach((name =>
        scene.load.image(name, 'assets/' + name + '.png')
    ));
}

// 'this' refers to a scene object
function preload() {
    this.load.image('ground', 'assets/ground.svg');
    
    let buildingAssets = [
        'building1', 'wall1', 'dumpster1', 'dumpster2', 'dumpster3', 'building2',
        'fence1', 'wall2', 'wallv1',
    ];
    loadbuildings(this, buildingAssets);

    this.load.spritesheet('dog', 'assets/dog.gif', { frameWidth: 32, frameHeight: 20 });
    this.load.spritesheet('human', 'assets/adventurer-Sheet.png', { frameWidth: 50, frameHeight: 37 });
    cursors = this.input.keyboard.createCursorKeys();
}

function spawnPlayer(scene, id, x, y, isHuman) {
    let sname = ''
    if (isHuman) sname = 'human'
    else 'dog'
    let newPlayer = scene.physics.add.sprite(x, y, sname);
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
    let b1 = scene.walls.create(200, 200, 'building1').setOrigin(0,1).refreshBody();
    // b1.body.originY(1);
    let w1 = scene.walls.create(b1.x+b1.width, b1.y - b1.height + 151, 'wall1').setOrigin(0,1).refreshBody();
    scene.walls.create(b1.x+b1.width, w1.y-w1.height, 'dumpster1').setOrigin(0,1).refreshBody();
    scene.walls.create(b1.x+b1.width, b1.y-b1.height+30, 'fence1').setOrigin(0,1).refreshBody();
    scene.walls.create(b1.x+b1.width+60, b1.y-b1.height+30, 'fence1').setOrigin(0,1).refreshBody();
    let b2 = scene.walls.create(w1.x+w1.width+50, 200, 'building1').setOrigin(0,1).refreshBody();
    let b3 = scene.walls.create(b2.x+b2.width+50, 200, 'building2').setOrigin(0,1).refreshBody();
    
    scene.walls.create(0, 300, 'wallv1').setOrigin(0,1).refreshBody();
    scene.walls.create(17, 300, 'wall2').setOrigin(0,1).refreshBody();
    scene.walls.create(50, 300, 'wall2').setOrigin(0,1).refreshBody();
    scene.walls.create(115, 300+32, 'wallv1').setOrigin(0,1).refreshBody();
    scene.walls.create(115, 300+24, 'wallv1').setOrigin(0,1).refreshBody();

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

    this.anims.create({
        key: 'human-idle',
        frames: this.anims.generateFrameNumbers('human', { start: 4, end: 6 }),
        frameRate: 5,
        repeat: -1 // repeat infinitely
    })

    this.anims.create({
        key: 'human-walk',
        frames: this.anims.generateFrameNumbers('human', { start: 7, end: 12 }),
        frameRate: 10,
        repeat: -1 // repeat infinitely
    })
}

function renderPlayers(scene) {
    // console.log('curPlayers', Object.keys(curPlayers).length);
    // console.log('players', players.length);

    let serverUpdate = getCurrentState();

    // spawn client player
    if (!player) {
        player = {
            sprite: spawnPlayer(
                scene, serverUpdate.me.id, serverUpdate.me.x, serverUpdate.me.y,
                serverUpdate.me.isHuman),
            isHuman: serverUpdate.me.isHuman
        }
    }

    console.log(serverUpdate.others)

    // update remote players
    serverUpdate.others.forEach((player => {
        if (!(player.id in curPlayers)) {
            curPlayers[player.id] = {
                sprite: spawnPlayer(scene, player.id, player.x, player.y, player.isHuman),
                isHuman: player.isHuman
            }
        }
        let curPlayer = curPlayers[player.id];

        if (player.moving) {
            if (curPlayer.isHuman) {
                curPlayer.sprite.anims.play('human-walk', true);
            } else {
                curPlayer.sprite.anims.play('left', true);
            }
        } else {
            if (curPlayer.isHuman) {
                curPlayer.sprite.anims.play('human-idle', true);
            } else {
                curPlayer.sprite.anims.play('idle', true);
            }
        }

        curPlayers[player.id].sprite.setPosition(player.x, player.y);
        curPlayers[player.id].sprite.flipX = player.right;
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

        if (xmov == 1) player.sprite.flipX = true;
        else if (xmov == -1) player.sprite.flipX = false;
        
        if (player.isHuman) {
            player.sprite.anims.play('human-walk', true);
        } else {
            player.sprite.anims.play('left', true);
        }

    }
    else {
        if (player.isHuman) {
            player.sprite.anims.play('human-idle', true);
        } else {
            player.sprite.anims.play('idle', true);
        }
    }

    player.sprite.setVelocityX(xvel);
    player.sprite.setVelocityY(yvel);

    updatePosition({
        x: player.sprite.x, y: player.sprite.y, right: player.sprite.flipX, moving: length > 0
    });

}