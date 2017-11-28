'use strict';

const Generator = require('yeoman-generator');

module.exports = class extends Generator {
	constructor(args, opts) {
		super(args, opts);
	}

	writing() {
		this.fs.copy(
			this.templatePath(),
			this.destinationPath(), {
				globOptions: {
					dot: true
				}
			}
		);

		this.fs.move(
			this.destinationPath('_gitignore'),
			this.destinationPath('.gitignore')
		);
	}
};
