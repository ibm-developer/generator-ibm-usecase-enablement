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
const logger = require('log4js').getLogger('generator-usecase-enablement:language-java');
const Generator = require('yeoman-generator');
const fs = require('fs');
const path = require('path');
const handlebars = require('../lib/helpers').handlebars;
const Glob = require('glob');
const _ = require('lodash');
const minimatch = require('minimatch');

const CONFIG_JSON_TEMPLATE = 'config.json.template';    //controls configuration for a give use case

module.exports = class extends Generator {

	constructor(args, opts) {
		super(args, opts);
		this.context = opts.context;
		logger.setLevel(this.context.loggerLevel);
	}

	configuring() {
		logger.debug('>>> configuring');
		const configFilePath = path.join(this.context.starterKitSourcesPath, this.context.language, CONFIG_JSON_TEMPLATE);
		if(fs.existsSync(configFilePath)) {
			logger.info('Setting dependencies in parent context');
			let dependenciesString = this.fs.read(configFilePath);
			const template = handlebars.compile(dependenciesString);
			dependenciesString = template(this.context.usecaseContext);
			this.context._addDependencies(dependenciesString);
		}
	}

	writing() {
		logger.debug('>>> writing');
		const templateContext = {
			bluemix: this.context.bluemix
		};

		const srcRoot = this.context.starterKitSourcesPath;
		const srcJavaPath = path.join(this.context.starterKitSourcesPath, this.context.language);
		const srcPublicPath = srcRoot + '/public';
		const srcSharedPath = srcRoot + '/shared';

		const dstRoot = this.destinationPath();
		let dstSharedPath = path.join(dstRoot, 'src','main','webapp');;
		let dstPublicPath = path.join(dstRoot, 'src','main','webapp');
		if (this.context.language !== 'java-liberty') {
			dstPublicPath = path.join(dstRoot, 'src', 'main', 'resources', 'static');
			dstSharedPath = path.join(dstRoot, 'src', 'main', 'resources');
		}

		// Copy /src/shared
		if (fs.existsSync(srcSharedPath)){
			logger.debug('Copying shared files from', srcSharedPath);
			this._copyFiles(srcSharedPath, dstSharedPath, templateContext);
		}

		// Copy /src/public
		if (fs.existsSync(srcPublicPath)){
			logger.debug('Copying public files from', srcPublicPath);
			this._copyFiles(srcPublicPath, dstPublicPath, templateContext);
		}

		// Copy /src
		if (fs.existsSync(srcJavaPath)){
			logger.debug('Copying python-flask files from', srcJavaPath);
			this._copyFiles(srcJavaPath, dstRoot, templateContext);
		}
	}

	_copyFiles(srcPath, dstPath, templateContext) {
		logger.debug('Copying files recursively from', srcPath, 'to', dstPath);
		const files = Glob.sync(srcPath + '/**/*', {dot: true});
		_.each(files, function (srcFilePath) {

			// Do not process srcFilePath if it is pointing to a directory
			if (fs.lstatSync(srcFilePath).isDirectory()) return;

			// Do not process files that end in .partial, they're processed separately
			if (srcFilePath.indexOf('.partial') > 0 || srcFilePath.indexOf('.replacement') > 0) return;

			// Do not process CONFIG_JSON_TEMPLATE
			if (srcFilePath.indexOf(CONFIG_JSON_TEMPLATE) > 0) return;

			const dstFilePath = srcFilePath.replace(srcPath, dstPath);
			let isEjsTemplate = true;
			_.each(this.context.ejsExcludePatterns, function (ejsExludePattern) {
				if (minimatch(path.basename(srcFilePath), ejsExludePattern)) {
					isEjsTemplate = false;
					return false;
				}
			});
			if (isEjsTemplate) {
				logger.debug('Copying template', srcFilePath, 'to', dstFilePath);
				this.fs.copyTpl(srcFilePath, dstFilePath, templateContext);
			} else {
				logger.debug('Copying file', srcFilePath, 'to', dstFilePath);
				this.fs.copy(srcFilePath, dstFilePath);
			}

		}.bind(this));
	}
	end() {
		logger.debug('>>> end');
	}
};

