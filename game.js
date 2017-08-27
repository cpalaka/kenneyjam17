var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

function preload() {
  
    game.load.atlasXML("player1","assets/alienPink.png","assets/alienPink.xml");
    game.load.atlasXML("enemies", "assets/enemies.png", "assets/enemies.xml");
    //game.load.image("ground", "assets/ground.png");
    game.load.tilemap('level1', 'assets/level1.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image("tiles1", "assets/tiles_spritesheet.png");
    game.load.image("bullet","assets/laserPurpleDot.png");
    

}

var player;
var bee;
var map;
var layer;
var movekeys;
var jumpkey;
var bullet;
var isMouseDown = false;

var jumpVelocity = -700;

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.gravity.y = 1000;

    game.stage.backgroundColor = "#d9faff";

    map = game.add.tilemap("level1");
    map.addTilesetImage("tiles_spritesheet", "tiles1");

    map.setCollisionByExclusion([41]);
    layer = map.createLayer('Tile Layer 1');
    //layer.debug = true;

    layer.resizeWorld();

    player = game.add.sprite(20, 2500, "player1", "alienPink_walk1.png");
    player.data = {attacked: false};

    player.animations.add("walk", ["alienPink_walk1.png","alienPink_walk2.png"], 10, true);
    player.animations.add("idle",["alienPink_stand.png"],30,false);
    player.animations.add("jump", ["alienPink_jump.png"],30, false);
    player.animations.add("airturn",["alienPink_swim2.png"],30, false);
    player.animations.add("hurt",["alienPink_hurt.png"], 15, false);

    game.physics.enable(player, Phaser.Physics.ARCADE);
    player.body.bounce.y = 0.1;
    player.body.collideWorldBounds = true;

    //bee = game.add.sprite(game.world.width/2, game.world.height/2, "bee", "bee_fly.png");
    bee = game.add.sprite(400, 2200, "enemies", "bee_fly.png");
    bee.animations.add("fly",["bee.png"], 15, false);
    bee.animations.add("hit",["bee_hit.png"],15, false);
    bee.animations.add("dead",["bee_dead.png"], 15, false);
    
    game.physics.enable(bee, Phaser.Physics.ARCADE);
    bee.body.bounce.y = 0.3;
    bee.body.collideWorldBounds = true;
    bee.body.allowGravity = false;
    bee.body.drag.x = 1000;
    bee.body.drag.y = 1000;
    //bee.body.friction.x = 2000;
    //bee.body.friction.y = 2000;
    //hit counter for bee
    bee.data = {hitCount: 0, dead: false};
    
    game.camera.x = 0;
    game.camera.y = 2900;
    //game.camera.setBoundsToWorld();
    game.camera.follow(player);
    //console.log(game.world._width, game.world._height);
    //console.log(game.camera.x, game.camera.y);

    //create bullet
    bullet = game.add.weapon(100, "bullet");
    bullet.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
    bullet.bulletSpeed = 700;
    bullet.bulletGravity.y = -990;
    bullet.fireRate = 100;
    //bullet.fireRateVariance = 50;
    bullet.trackSprite(player, player.width+10, player.height/2+20);

    movekeys = game.input.keyboard.addKeys( { 'up': Phaser.KeyCode.W, 'down': Phaser.KeyCode.S, 'left': Phaser.KeyCode.A, 'right': Phaser.KeyCode.D } );
    jumpkey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    //if mouse is clicked, fire bullet
    game.input.mouse.mouseDownCallback = function() {isMouseDown = true};
    game.input.mouse.mouseUpCallback = function() {isMouseDown = false};

    //start timer event
    game.time.events.loop(Phaser.Timer.SECOND, stabilizeJumpVelocity, this);
}

function update() {
    player.data["attacked"] = false;
    player.body.velocity.x = 0;


    game.physics.arcade.collide(player,layer);
    game.physics.arcade.collide(bee, layer);
    game.physics.arcade.collide(player, bee, function(p, b) {
        player.data["attacked"] = true;
    });

    //check for bullet collision
    bullet.forEach(checkBulletCollision, this);

    
    //isMouseDown = false;

    if(!bee.data["dead"]) {bee.animations.play("fly");  game.physics.arcade.moveToObject(bee, player, 200);}
    else {bee.animations.play("dead");}

    //key and mouse events
    if(movekeys.right.isDown) {
        //player.body.velocity.x = 150;

        if(player.body.onFloor()) {
            player.body.velocity.x = 200;
            player.animations.play("walk");
        } else {
            player.body.velocity.x = 250;
            player.animations.play("airturn");
        }
    }
    else if(movekeys.left.isDown) {
        //player.body.velocity.x = -150;
        
        if(player.body.onFloor()) {
            player.body.velocity.x = -200;
            player.animations.play("walk");
        } else {
            player.body.velocity.x = -250;
            player.animations.play("airturn");
        }
    } else {
        if(player.body.onFloor()) {
            player.animations.play("idle");
        }
        if(player.data["attacked"]) player.animations.play("hurt");
    }

    if (jumpkey.isDown && player.body.onFloor())
    {
         player.body.velocity.y = jumpVelocity;
         player.animations.play("jump");
         //jumpTimer = game.time.now + 750;
    }

    if(isMouseDown) bullet.fireAtPointer();
}

function checkBulletCollision(_bullet) {
    game.physics.arcade.collide(_bullet, layer, destroyBullet);

    game.physics.arcade.collide(_bullet, bee, function(_bullet, bee) {
        bee.data["hitCount"] += 1;
        console.log(bee.data["hitCount"]);
        _bullet.kill();

        bee.animations.play("hit");

        if(bee.data["hitCount"] >= 50) {
            bee.data["dead"] = true;
            bee.body.allowGravity = true;
            bee.body.drag.x = 0;
            bee.body.drag.y = 0;
        }
    });
}

function destroyBullet(bullet, layer) {
    bullet.kill();
    if (jumpkey.isDown && !player.body.onFloor()) {
        jumpVelocity -= 20;
    }
    
}

function stabilizeJumpVelocity() {
    if(jumpVelocity <= -800 ) jumpVelocity += 100;
}