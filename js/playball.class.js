class Playball {

	constructor(name, game, settings) {		
		this.name = name;
		this.game = game;
		this.settings = settings;
	}


	preload() {
		this.game.load.image(this.name, this.settings[this.name].image);
		console.log("IMage name: " + this.settings[this.name].image);
	}

	createSprite(coordX, coordY) {
		// Create sprite (name should match image loaded before creating this object)
		this.sprite = this.game.add.sprite(coordX, coordY, this.name);
		this.sprite.anchor.setTo(0.5, 0.5);
		this.sprite.scale.set(0.5, 0.5);

		// Enable physics (creates the body as well);
		this.game.physics.p2.enable( [ this.sprite ] );

		// By default the Body is a rectangle. Let's turn it into a circle with a radius in pixels		
		this.sprite.body.setCircle(55);

		this.game.playball.sprite.body.velocity.y = -350;
	}

	applySettings() {
		// Apply mass
		this.sprite.body.mass = this.settings.ballProperties.mass;
	}

}