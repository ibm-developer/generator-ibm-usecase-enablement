'use strict';

const logger = require('log4js').getLogger("generator-service-enablement:language-swift-kitura");
const fs = require('fs');
const path = require('path');
const Glob = require('glob');
const _ = require('lodash');

const appPath = "Sources/Application/";

let Generator = require('yeoman-generator');

module.exports = class extends Generator {
	constructor(args, opts) {
		super(args, opts);
		this.context = opts.context;
		logger.setLevel(this.context.loggerLevel);
		logger.debug("Constructing");
	}

	configuring() {
		logger.debug("Configuring");

		// finding and injecting dependencies from Package.swift.partial
		// dependencies should each be a single line (see example below)
		// .package(url: "https://github.com/IBM-Swift/CloudEnvironment.git", from: "3.0.0"),

		let packageSwiftPath = path.join(this.context.starterKitSourcesPath, "swift-kitura", "Package.swift.partial");
	    if(fs.existsSync(packageSwiftPath)) {
	    	logger.info("Adding Usecase Dependencies");
	    	let dependenciesString = this.fs.read(packageSwiftPath);

	    	// grabbing individual lines to inject
	    	dependenciesString.split('\n').forEach(dependency => {
				let trimmedDependency = dependency.trim();
				if (trimmedDependency) {
					this.context.injectDependency(trimmedDependency);
				}
			});
	    } else {
	    	logger.error("Could not find Package.swift.partial at ", packageSwiftPath);
	    }
	}

	writing() {
		logger.debug("Writing");

		let srcPath = path.join(this.context.starterKitSourcesPath, "swift-kitura", appPath);
		let dstPath = path.join(this.destinationPath(), appPath);

		let files = Glob.sync(srcPath + "/**/*", {dot: true});

		_.each(files, function (srcFilePath) {
			// Do not process srcFilePath if it is pointing to a directory
			if (fs.lstatSync(srcFilePath).isDirectory()) return;

			let dstFilePath = srcFilePath.replace(srcPath, dstPath);

			logger.debug("Copying file", srcFilePath, "to", dstFilePath);
			this.fs.copy(srcFilePath, dstFilePath);
		}.bind(this));
	}
}
