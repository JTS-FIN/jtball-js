class ScoreKeeper {

	constructor(playball, game, settings) {
		this.playball = playball;
		this.game = game;
		this.settings = settings;
		this.player1 = {};
		this.player2 = {};
		this.player1.score = 0;
		this.player2.score = 0;

		this.player1.text = this.game.add.text(0, 0, this.player1.score, this.settings.scoreTextStyle);
		this.player1.text.setTextBounds(0, 25, 150, 50);
		this.player2.text = this.game.add.text(0, 0, this.player2.score, this.settings.scoreTextStyle);
		this.player2.text.setTextBounds(this.game.world.width - 150, 25, 150, 50);
		console.log("World height" + this.game.world.height);
		console.log("Playball bottom" + this.playball.sprite.bottom);
	}

	update() {
		if (this.playball.sprite.bottom > (this.game.world.height - 1)) {
			if (this.playball.sprite.body.x < this.game.world.centerX) {
				this.player2.score += 1;
				this.player2.text.text = this.player2.score;
				this.player2.text.update();
			}
			if (this.playball.sprite.body.x > this.game.world.centerX) {
				this.player1.score += 1;
				this.player1.text.text = this.player1.score;
				this.player1.text.update();
			}
		}
	}

}