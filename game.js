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
  scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 800,
      height: 600
  }

};

var game = new Phaser.Game(config);

// Scene functions
function init()
{

}

// 'this' refers to a scene object
function preload()
{
  // this.load.setBaseURL('http://labs.phaser.io');

  this.load.image('ground', 'assets/map.png');
  this.load.spritesheet('dog', 'assets/dog.gif', {frameWidth: 32, frameHeight: 20});
  cursors = this.input.keyboard.createCursorKeys();
  // this.load.image('logo', 'assets/sprites/phaser3-logo.png');
  // this.load.image('red', 'assets/particles/red.png');
}

function create()
{
  // this.add.tileSprite(400, 300, 800, 600, 'ground');
  this.add.image(400, 300, 'ground');

  // omitting var makes it a global variable
  player = this.physics.add.sprite(32, 20, 'dog');
  player.setCollideWorldBounds(true);
  // this.physics.add.collider(player, somecollidergroup);

  this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('dog', {start: 0, end: 1}),
      frameRate: 2,
      repeat: -1 // repeat infinitely
  });

  this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('dog', {start: 8, end: 15}),
      frameRate: 10,
      repeat: -1 // repeat infinitely
  });

  this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('dog', {start: 14, end: 19}),
      frameRate: 10,
      repeat: -1 // repeat infinitely
  });

  // var particles = this.add.particles('red');

  // var emitter = particles.createEmitter({
  //     speed: 100,
  //     scale: { start: 1, end: 0 },
  //     blendMode: 'ADD'
  // });

  // var logo = this.physics.add.image(400, 100, 'logo');

  // logo.setVelocity(100, 200);
  // logo.setBounce(1, 1);
  // logo.setCollideWorldBounds(true);

  // emitter.startFollow(logo);
}

function update()
{
  // player.setVelocityX(0);
  // player.anims.play('idle', true);

  var xmov = 0;
  var ymov = 0;

  if (cursors.left.isDown)
  {
      xmov = -1;
  }
  if (cursors.right.isDown)
  {
      xmov = 1;
  }
  if (cursors.down.isDown)
  {
      ymov = 1;
  }
  if (cursors.up.isDown)
  {
      ymov = -1;
  }
  
  var length = Math.sqrt(xmov*xmov + ymov*ymov);
  var xvel = 0;
  var yvel = 0;
  if (length > 0)
  {
      xvel = (xmov / length) * 200;
      yvel = (ymov / length) * 200;
      
      if (xmov == 1)          player.flipX = true;
      else if (xmov == -1)    player.flipX = false;
      player.anims.play('left', true);
  }
  else
  {
      player.anims.play('idle', true);
  }
  
  player.setVelocityX(xvel);
  player.setVelocityY(yvel);
  
}