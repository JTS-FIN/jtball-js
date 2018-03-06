/**
 * When you actually play the this.game
 **/ 
class GameState {

	constructor(settings) {
		this.settings = settings;
	}

	preload() {
		this.game.players.player1.preload();
		this.game.players.player2.preload();
		this.game.playball.preload();

		// Scale the this.game
		// Makes the canvas as big as it can get on current screen
		this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	}

	create() {
		this.game.stage.backgroundColor = "#F0F0F0";

		this.game.time.advancedTiming = true;
		this.game.time.desiredFps = 60;

		this.game.physics.startSystem(Phaser.Physics.P2JS);

		// This makes physics not related to FPS, dunno why it is related by default to fps in the first place
		// Needed for "bullet time" basically
		this.game.physics.p2.useElapsedTime = true;

		//  Set the world (global) gravity
		this.game.physics.p2.gravity.y = this.settings.gravity;

		// Touch input/mouse
		this.game.input.addPointer();
		
		// Create player sprites
		this.game.players.player1.createSprite(this.game.world.centerX / 4, this.game.world.height - 55);
		this.game.players.player2.createSprite(this.game.world.centerX * 1.75, this.game.world.height - 55);

		// And create the playing ball sprite
		this.game.playball.createSprite(this.game.world.centerX, this.game.world.centerY);

		// Create the net, we add this as a "invisible sprite", sprite is needed
		// for collisions
		// Logic for Y-location is bit complicated, since the coordinate it sets is the center of the sprite...
		this.game.net = this.game.add.sprite(this.game.world.centerX, (this.game.world.height - this.settings.net.height) + this.settings.net.height / 2, null);

		// This restricts players to their own sides of the play area
		this.game.playareaRestrictor = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, null);

		// Apply physics to objects
		this.game.physics.p2.enable( [ this.game.net, this.game.playareaRestrictor]);

		// Create a collision rectangles
		this.game.playareaRestrictor.body.setRectangle(this.settings.net.width, this.game.world.height, 0, 0);
		this.game.net.body.setRectangle(this.settings.net.width, this.settings.net.height, 0, 0);

		// Players group
		var playerCollisionGroup = this.game.physics.p2.createCollisionGroup();
		// Playarearestrictor
		var playareaRestrictorCollisionGroup = this.game.physics.p2.createCollisionGroup();
		// Contains playball and net
		var gameObjectCollisionGroup = this.game.physics.p2.createCollisionGroup(); 

		// Make net and restrictor to stay where it is
		this.game.net.body.static = true;
		this.game.playareaRestrictor.body.static = true;

		this.game.playareaRestrictor.body.setCollisionGroup(playareaRestrictorCollisionGroup);
		this.game.players.player1.sprite.body.setCollisionGroup(playerCollisionGroup);
		this.game.players.player2.sprite.body.setCollisionGroup(playerCollisionGroup);
		this.game.playball.sprite.body.setCollisionGroup(gameObjectCollisionGroup);
		this.game.net.body.setCollisionGroup(gameObjectCollisionGroup);

		// Define what collides with what
		this.game.playareaRestrictor.body.collides([playareaRestrictorCollisionGroup, playerCollisionGroup]);
		this.game.players.player1.sprite.body.collides([playareaRestrictorCollisionGroup, playerCollisionGroup, gameObjectCollisionGroup]);
		this.game.players.player2.sprite.body.collides([playareaRestrictorCollisionGroup, playerCollisionGroup, gameObjectCollisionGroup]);
		this.game.playball.sprite.body.collides([playerCollisionGroup, gameObjectCollisionGroup]);
		this.game.net.body.collides([gameObjectCollisionGroup]);

		// These objects collide with the world limits
		this.game.physics.p2.boundsCollideWith = [ this.game.players.player1.sprite, this.game.players.player2.sprite, this.game.playball];
		this.game.physics.p2.updateBoundsCollisionGroup();

		// Finally draw the net, so it is actually visible
		this.game.net.graphics = this.game.add.graphics(0, 0);
		this.game.net.graphics.beginFill(0x000000, 0.5);
		this.game.net.graphics.drawRect(this.game.net.body.x - this.settings.net.width / 2, this.game.net.body.y - this.settings.net.height / 2, this.settings.net.width, this.settings.net.height);
		this.game.net.graphics.endFill();

		// Create materials, which define how the interaction between these sprites occcur (friction, bounciness etc)
		// @TODO make a class or atleast function to handle the material creatings, now it takes more than half of the code in
		// Main create class!
		var ballMaterial = this.game.physics.p2.createMaterial('spriteMaterial', this.game.players.player1.sprite.body);
		var worldMaterial = this.game.physics.p2.createMaterial('worldMaterial');
		this.game.physics.p2.setWorldMaterial(worldMaterial, true, true, true, true);

		// Apply materials to other balls as well
		this.game.players.player2.sprite.body.setMaterial(ballMaterial);
		this.game.playball.sprite.body.setMaterial(ballMaterial);

		// Apply world material to net
		this.game.net.body.setMaterial(worldMaterial);
		this.game.playareaRestrictor.body.setMaterial(worldMaterial);


		// Contact materials
		var contactMaterialWithWorld = this.game.physics.p2.createContactMaterial(ballMaterial, worldMaterial);
		var contactMaterialBetweenBalls = this.game.physics.p2.createContactMaterial(ballMaterial, ballMaterial);

		// Friction to use in the contact of these two materials.
		contactMaterialWithWorld.friction = 5;

		// Restitution (i.e. how bouncy it is!) to use in the contact of these two materials.
		contactMaterialWithWorld.restitution = this.settings.ballProperties.bouncinessWithWorld;  

		// Stiffness of the resulting ContactEquation that this ContactMaterial generate.
		contactMaterialWithWorld.stiffness = 1e7;

		// Relaxation of the resulting ContactEquation that this ContactMaterial generate.
		contactMaterialWithWorld.relaxation = 3;

		// Stiffness of the resulting FrictionEquation that this ContactMaterial generate.
		contactMaterialWithWorld.frictionStiffness = 1e7;

		// Relaxation of the resulting FrictionEquation that this ContactMaterial generate.
		contactMaterialWithWorld.frictionRelaxation = 300;

		// Will add surface velocity to this material. If bodyA rests on top if bodyB, and the surface velocity is positive, bodyA will slide to the right.
		contactMaterialWithWorld.surfaceVelocity = 0;        

		// And same logic to contacts between balls (I enjoy saying that)
		contactMaterialBetweenBalls.friction = 30;
		contactMaterialBetweenBalls.restitution = this.settings.ballProperties.bouncinessBetweenBalls;			
		contactMaterialBetweenBalls.stiffness = 1e7;
		contactMaterialBetweenBalls.relaxation = 3;
		contactMaterialBetweenBalls.frictionStiffness = 1e7;
		contactMaterialBetweenBalls.frictionRelaxation = 3;
		contactMaterialBetweenBalls.surfaceVelocity = 0;

		// Bind the keys and such things to players and playball
		this.game.players.player1.applySettings();
		this.game.players.player2.applySettings();
		this.game.playball.applySettings();

		// This keeps track of the score (and draws it for now atleast)
		this.game.scorekeeper = new ScoreKeeper(this.game.playball, this.game, this.settings);
	}

	resetPositions() {
		this.game.players.player1.sprite.body.x = this.game.world.centerX / 4;
		this.game.players.player1.sprite.body.y = this.game.world.height - 55;
		this.game.players.player1.sprite.body.velocity.x = this.game.players.player1.sprite.body.velocity.y = 0;
		this.game.players.player1.sprite.body.setZeroRotation();

		this.game.players.player2.sprite.body.x = this.game.world.centerX * 1.75;
		this.game.players.player2.sprite.body.y = this.game.world.height - 55;
		this.game.players.player2.sprite.body.velocity.x = this.game.players.player2.sprite.body.velocity.y = 0;
		this.game.players.player2.sprite.body.setZeroRotation();

		this.game.playball.sprite.body.x = this.game.world.centerX;
		this.game.playball.sprite.body.y = this.game.world.centerY;
		this.game.playball.sprite.body.velocity.x = 0;
		this.game.playball.sprite.body.velocity.y = -350;
		this.game.playball.sprite.body.setZeroRotation();
	}

	update() {
		// This is how we make smooth slowmotion, otherwise it is choppy
		// Assuming FPS is 60
		this.game.time.desiredFps = this.game.time.slowMotion * 60;
		this.game.players.player1.update();
		this.game.players.player2.update();
		this.game.scorekeeper.update();
	}

	render() {
		//this.game.debug.spriteInfo(this.game.playball.sprite, 32, 32);
		//this.game.debug.text("Bottom: " + this.game.playball.sprite.bottom, 150, 150);
		//this.game.debug.geom(this.game.players.player2.power.line, 'rgba(255,0,0,1)' ) ;
		this.game.players.player2.render();
		if (this.settings.debug.fps) {
			this.game.debug.object(this.game.time, 20, 60, {
				keys: ['slowMotion', 'desiredFps', 'physicsElapsedMS'],
				label: 'game.time',
				color: 'auto',
			  });
		}
		//this.game.debug.pointer(this.game.input.activePointer);

	}
}