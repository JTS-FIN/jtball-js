/**
 * Represents a player which is controllable 
 * (may be controlled by human or AI)
 **/
class Player {

	constructor(name, game, settings) {
		this.name = name;
		this.game = game;
		this.settings = settings;
	}

	preload() {
		this.game.load.image(this.name, this.settings[this.name].image);
		console.log(this.name);
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

		// Power represents charging when user pushes the down-button, and when released launched into the ball
		this.power = { value: 0, angle: 0, line: null };

		// Create power lines to balls (these indicate the launch power and direction)
		this.power.line = new Phaser.Line(this.sprite.body.x, this.sprite.body.y, this.sprite.body.x, this.sprite.body.y);
		this.power.line.graphics = this.game.add.graphics(0,0);
	}

	applySettings() {
		// Bind keys	
		this.keys = {};
		this.keys.up = this.game.input.keyboard.addKey(this.settings[this.name].keys.up);
		this.keys.right = this.game.input.keyboard.addKey(this.settings[this.name].keys.right);
		this.keys.left = this.game.input.keyboard.addKey(this.settings[this.name].keys.left);
		this.keys.down = this.game.input.keyboard.addKey(this.settings[this.name].keys.down);

		// Apply mass
		this.sprite.body.mass = this.settings.ballProperties.mass;
	}

	update() {
		if (this.keys.left.isDown) {
			this.power.angle += this.settings.turningSpeed * -1;
		}
		if (this.keys.right.isDown) {				
			this.power.angle += this.settings.turningSpeed;
		}
		if (this.keys.down.isDown) {
			this.power.value += this.settings.chargeSpeed;
			if (this.power.value > this.settings.chargeMax) {
				this.power.value = this.settings.chargeMax;
			}
		}
		// When down-key is relesed, apply to power to the balls movement
		if (this.keys.down.justUp) {
			this.sprite.body.velocity.x += Math.cos(this.power.angle) * this.power.value * 15;
			this.sprite.body.velocity.y += Math.sin(this.power.angle) * this.power.value * 15;
			this.power.value = 0;
		}

		// Update the power lines
		this.power.line.fromAngle(this.sprite.body.x + Math.cos(this.power.line.angle) * 55, this.sprite.body.y + Math.sin(this.power.line.angle) * 55, this.power.angle, this.power.value);

		// Draw the graphics for the lines
		this.power.line.graphics.clear();
		this.power.line.graphics.lineStyle(10, this.settings[this.name].powerLineColor, 1);
		this.power.line.graphics.moveTo(this.power.line.start.x, this.power.line.start.y);
		this.power.line.graphics.lineTo(this.power.line.end.x, this.power.line.end.y);
	}

}
