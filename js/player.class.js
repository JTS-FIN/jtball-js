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
		this.aiControlled = this.settings[this.name].aiControlled;
	}

	update() {
		if(this.aiControlled === true) {
			return this.aiUpdate();
		}

		var onGround = false;
		if (this.sprite.bottom > (this.game.world.height - 2)) {
			onGround = true;
			this.sprite.body.velocity.y = 0;
		}

		// We are not charging the strike, so we can actually move with left and right buttons
		if (this.power.value === 0) {
			if (onGround) {
				this.sprite.body.velocity.y = 0;
			}
			if (this.keys.left.isDown || (this.game.input.activePointer.isDown && this.game.input.activePointer.x < this.sprite.body.x)) {
				if (onGround === true) {
					// if we move already faster to this direction, we dont slow down with this
					// So only apply when we are moving slower to left than this
					if (this.sprite.body.velocity.x > this.settings.groundMovingSpeed * -1) {
						this.sprite.body.velocity.x = this.settings.groundMovingSpeed * -1;
					}
				}
				else {
					if (this.sprite.body.velocity.x > this.settings.airMovingSpeed * -1) {
						this.sprite.body.velocity.x = this.settings.airMovingSpeed * -1;
					}
				}
			}
			else if (this.keys.right.isDown || (this.game.input.activePointer.isDown && this.game.input.activePointer.x > this.sprite.body.x)) {
				if (onGround === true) {
					if (this.sprite.body.velocity.x < this.settings.groundMovingSpeed ) {
						this.sprite.body.velocity.x = this.settings.groundMovingSpeed;
					}
					
				}
				else {
					if (this.sprite.body.velocity.x < this.settings.airMovingSpeed ) {
						this.sprite.body.velocity.x = this.settings.airMovingSpeed;
					}
				}
			}
			else if (onGround === true) {
				// We are emulating friction with ground, since the actual material friction doesnt
				// seem to work with rolling...
				this.sprite.body.velocity.x *= 0.9;
			}
		}

		// We are charging the strike
		if (this.power.value > 0) {
			if (this.game.input.activePointer.isDown) {
				this.power.angle = Math.atan2(this.game.input.activePointer.position.y - this.sprite.body.y, this.game.input.activePointer.position.x - this.sprite.body.x)
			}
			else {
				if (this.keys.left.isDown) {
					this.power.angle += this.settings.turningSpeed * -1;
				}
				if (this.keys.right.isDown) {				
					this.power.angle += this.settings.turningSpeed;
				}
			}
		}

		// Charging the strike, if we press keydown, or press pointer in the higher than 3rd of the height of the game
		if ((this.keys.down.isDown
			  || (this.game.input.activePointer.isDown && this.game.input.activePointer.y < this.game.world.height * 0.66)
			  || (this.power.value > 0 && this.game.input.activePointer.isDown === true))
			  && onGround === true) {
			// We stop the moving, seems to be more fun play that way
			//this.sprite.body.velocity.x = 0;
			this.power.value += this.settings.chargeSpeed;
			if (this.power.value > this.settings.chargeMax) {
				this.power.value = this.settings.chargeMax;
			}
			this.game.time.slowMotion = 5;
		}
		// When down-key is relesed, apply to power to the balls movement
		if (this.game.input.activePointer.justReleased() || this.keys.down.justUp) {
			this.sprite.body.velocity.x += Math.cos(this.power.angle) * this.power.value * 15;
			this.sprite.body.velocity.y += Math.sin(this.power.angle) * this.power.value * 15;
			this.power.value = 0;
			this.game.time.slowMotion = 1;
		}

		// Update the power lines
		this.power.line.fromAngle(this.sprite.body.x + Math.cos(this.power.line.angle) * 55, this.sprite.body.y + Math.sin(this.power.line.angle) * 55, this.power.angle, this.power.value);

		// Draw the graphics for the lines
		this.power.line.graphics.clear();
		this.power.line.graphics.lineStyle(10, this.settings[this.name].powerLineColor, 1);
		this.power.line.graphics.moveTo(this.power.line.start.x, this.power.line.start.y);
		this.power.line.graphics.lineTo(this.power.line.end.x, this.power.line.end.y);
	}

	aiUpdate() {
		var playballBody = this.game.playball.sprite.body;

		// Distance to playball
		var distance = Math.sqrt( Math.pow(playballBody.x - this.sprite.body.x, 2) + Math.pow(playballBody.y - this.sprite.body.y, 2));

		// If ball is on the enemy side, we move to the "ready up"-position
		var distanceX = this.sprite.body.x - (this.game.world.centerX + this.game.world.centerX * 0.5);
		
		if (this.settings.debug.ai === true) {
			this.game.debug.text("Distance to AI: " + distance, 85, 25, { fill: '#FF0000;' });
			this.game.debug.text("Playball speed: " + playballBody.velocity.x + " - " + playballBody.velocity.y, 85, 35, { fill: '#FF0000;' });
		}

		var ballIsOnMySide = false;
		if (this.game.playball.sprite.body.x > this.game.world.centerX) {
			ballIsOnMySide = true;
			// We try to move below the ball if ball is on our side of the play area
			distanceX = this.sprite.body.x - this.game.playball.sprite.body.x;;
		}

		// Where playball will be when we want to hit it
		var playballXPrediction = this.game.playball.sprite.body.x + (75 + playballBody.velocity.x * 0.15 * (distance / (this.settings.chargeMax * 3) ));

		// What is the angle towards the point we aim the strike
		var angleToPlayball = Math.atan2(this.game.playball.sprite.body.y - this.sprite.body.y, playballXPrediction - this.sprite.body.x);

		var onGround = false;
		if (this.sprite.bottom > (this.game.world.height - 2)) {
			onGround = true;
		}

		// Please dont ask how this works. This is stack overflow coding, I have
		// no idea about logic behind this, i just know this works
		// But however, we determine which way we want to turn the power/charging line
		// and that is towards the play ball
		var angleOffset = angleToPlayball - this.power.angle;
		if (angleOffset > Math.PI) {
			angleOffset -= 2 * Math.PI;
		}
		if (angleOffset < Math.PI * -1) {
			angleOffset += 2 * Math.PI;
		}

		if (angleOffset < 0) {
			this.power.angle += this.settings.turningSpeed * 3 * -1;
		}
		if (angleOffset > 0) {				
			this.power.angle += this.settings.turningSpeed * 3;
		}
		
		// We are not charging the strike, so we can actually move with left and right buttons
		if (onGround) {
			this.sprite.body.velocity.y = 5;
		}
		//if (distanceX < 30 && distanceX >)
		// Move left
		if (distanceX > 15) {
			if (onGround === true) {
				// if we move already faster to this direction, we dont slow down with this
				// So only apply when we are moving slower to left than this
				if (this.sprite.body.velocity.x > this.settings.groundMovingSpeed * -1) {
					this.sprite.body.velocity.x = this.settings.groundMovingSpeed * -1;
				}
			}
			else {
				if (this.sprite.body.velocity.x > this.settings.airMovingSpeed * -1) {
					//this.sprite.body.velocity.x = this.settings.airMovingSpeed * -1;
				}
			}
		}
		// Move right
		else if (distanceX < -15) {
			if (onGround === true) {
				if (this.sprite.body.velocity.x < this.settings.groundMovingSpeed ) {
					this.sprite.body.velocity.x = this.settings.groundMovingSpeed;
				}
				
			}
			else {
				if (this.sprite.body.velocity.x < this.settings.airMovingSpeed ) {
					//this.sprite.body.velocity.x = this.settings.airMovingSpeed;
				}
			}
		}
		else if (onGround === true) {
			// We are emulating friction with ground, since the actual material friction doesnt
			// seem to work with rolling...
			this.sprite.body.velocity.x *= 0.9;
		}

		this.power.value += this.settings.chargeSpeed;
		if (this.power.value > this.settings.chargeMax) {
			this.power.value = this.settings.chargeMax;
		}
		
		// When down-key is relesed, apply to power to the balls movement
		if (this.game.playball.sprite.body.x > this.game.world.centerX && this.power.value === this.settings.chargeMax && distance < 250 && onGround === true) {
			this.sprite.body.velocity.x += Math.cos(this.power.angle) * this.power.value * 15;
			this.sprite.body.velocity.y += Math.sin(this.power.angle) * this.power.value * 15;
			this.power.value = 0;
		}

		// Update the power lines
		this.power.line.fromAngle(this.sprite.body.x + Math.cos(this.power.line.angle) * 55, this.sprite.body.y + Math.sin(this.power.line.angle) * 55, this.power.angle, 500);


		if (this.settings.debug.ai === true) {
			// Draw the graphics for the lines
			this.power.line.graphics.clear();
			this.power.line.graphics.lineStyle(1, this.settings[this.name].powerLineColor, 1);
			this.power.line.graphics.moveTo(this.power.line.start.x, this.power.line.start.y);
			this.power.line.graphics.lineTo(this.power.line.end.x, this.power.line.end.y);
		}
	}

	render() {
	}
}
