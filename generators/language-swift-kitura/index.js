/*
 * © Copyright IBM Corp. 2017, 2018
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const logger = require('log4js').getLogger('generator-service-enablement:language-swift-kitura');
const fs = require('fs');
const path = require('path');
const Glob = require('glob');
const _ = require('lodash');

const appPath = 'Sources/Application/';

const Generator = require('yeoman-generator');

module.exports = class extends Generator {
	constructor(args, opts) {
		super(args, opts);
		this.context = opts.context;
		logger.level = this.context.loggerLevel;
		logger.debug('Constructing');
	}

	configuring() {
		logger.debug('Configuring');

		// finding and injecting dependencies from Package.swift.partial
		// dependencies should each be a single line (see example below)
		// .package(url: 'https://github.com/IBM-Swift/CloudEnvironment.git', from: '3.0.0'),

		const packageSwiftPath = path.join(this.context.starterKitSourcesPath, 'swift-kitura', 'Package.swift.partial');
		if (fs.existsSync(packageSwiftPath)) {
			logger.info('Adding Usecase Dependencies');
			const dependenciesString = this.fs.read(packageSwiftPath);

			// grabbing individual lines to inject
			dependenciesString.split('\n').forEach(dependency => {
				const trimmedDependency = dependency.trim();
				if (trimmedDependency) {
					this.context.injectDependency(trimmedDependency);
				}
			});
		} else {
			logger.error('Could not find Package.swift.partial at ', packageSwiftPath);
		}
	}

	writing() {
		logger.debug('Writing');

		const srcPath = path.join(this.context.starterKitSourcesPath, 'swift-kitura', appPath);
		const dstPath = path.join(this.destinationPath(), appPath);

		const files = Glob.sync(srcPath + '/**/*', {
			dot: true
		});

		_.each(files, function (srcFilePath) {
			// Do not process srcFilePath if it is pointing to a directory
			if (fs.lstatSync(srcFilePath).isDirectory()) return;

			const dstFilePath = srcFilePath.replace(srcPath, dstPath);

			logger.debug('Copying file', srcFilePath, 'to', dstFilePath);
			this.fs.copy(srcFilePath, dstFilePath);
		}.bind(this));
	}
};