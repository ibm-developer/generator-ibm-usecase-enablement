'use strict';

const logger = require('log4js').getLogger("generator-service-enablement:language-swift-kitura");
const fs = require('fs');
const path = require('path');

const appRoutesPath = "Sources/Application/Routes/AppRoutes.swift";

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
	    	logger.error("Could not find Package.swift at ", packageSwiftPath);
	    }
	}

	writing() {
		logger.debug("Writing");

		let srcAppRoutesPath = path.join(this.context.starterKitSourcesPath, "swift-kitura", appRoutesPath); 

		let destAppRoutesPath = path.join(this.destinationPath(), appRoutesPath);

	    try {
	    	//copy Sources/Application/Routes/AppRoutes.swift to destination
	    	logger.debug("Copying AppRoutes.swift from", srcAppRoutesPath, " to ", destAppRoutesPath);
	    	this.fs.copy(srcAppRoutesPath, destAppRoutesPath);
	    } catch (e) {
    	   	/* istanbul ignore next */
    	  	throw e;
	    }
	}
}
