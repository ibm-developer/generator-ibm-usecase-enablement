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

const Log4js = require('log4js');
const logger = Log4js.getLogger('generator-service-enablement:language-node-express');
const Glob = require('glob');
const _ = require('lodash');
const minimatch = require('minimatch');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

let Generator = require('yeoman-generator');

module.exports = class extends Generator {
	constructor(args, opts) {
		super(args, opts);
		this.context = opts.context;
		logger.level = this.context.loggerLevel;
		logger.debug('Constructing');
	}

	writing() {
		let srcRoot = this.context.starterKitSourcesPath;
		let srcPublicPath = srcRoot + '/public';
		let srcNodePath = srcRoot + '/node-express';
		let srcSharedPath = srcRoot + '/shared';

		let dstRoot = this.destinationPath();
		let dstPublicPath = dstRoot + '/public';
		let dstNodePath = dstRoot;

		let templateContext = {
			bluemix: this.context.bluemix
		};

		// Copy /src/shared
		if (fs.existsSync(srcSharedPath)){
			logger.debug('Copying shared files from', srcSharedPath);
			this._copyFiles(srcSharedPath, dstNodePath, templateContext);
		}

		// Copy /src/public
		if (fs.existsSync(srcPublicPath)){
			logger.debug('Copying public files from', srcPublicPath);
			this._copyFiles(srcPublicPath, dstPublicPath, templateContext);
		}

		// Copy /src/node-express
		if (fs.existsSync(srcNodePath)){
			logger.debug('Copying node-express files from', srcNodePath);
			this._copyFiles(srcNodePath, dstNodePath, templateContext);
		}

		// Process package.json.partial
		let srcPackageJsonPartialPath = srcNodePath + '/package.json.partial';
		if (this.fs.exists(srcPackageJsonPartialPath)) {
			this._addDependencies(this.fs.read(srcPackageJsonPartialPath));
		}

		// Process manifest.yaml.partial
		let srcManifestYamlPartialPath = srcNodePath + '/manifest.yml.partial';
		if (this.fs.exists(srcManifestYamlPartialPath)) {
			try {
				this._addOverrideYaml(yaml.safeLoad(this.fs.read(srcManifestYamlPartialPath)), './manifest.yml');
			} catch (e) {
				logger.error('Failed to parse manifest.yml.partial: ' + e);
			}
		}

		// Process .gitignore.partial
		let srcGitIgnorePartialPath = srcNodePath + '/.gitignore.partial';
		let dstGitIgnorePath = dstRoot + '/.gitignore';
		if (this.fs.exists(srcGitIgnorePartialPath)) {
			let srcGitIgnorePartialContent = this.fs.read(srcGitIgnorePartialPath);
			if (this.fs.exists(dstGitIgnorePath)) {
				this.fs.append(dstGitIgnorePath, srcGitIgnorePartialContent);
			} else {
				this.fs.write(dstGitIgnorePath, srcGitIgnorePartialContent);
			}
		}

		// Process Dockerfile.replacement: takes [{find:'string','replace':'newString}, {find:'string1','replace':'newString1}]
		let srcDockerfilePath = srcNodePath + '/Dockerfile.replacement';
		let dstDockerfilePath = dstRoot + '/Dockerfile';
		if (this.fs.exists(srcDockerfilePath) && this.fs.exists(dstDockerfilePath)) {
			let srcDockerContent = this.fs.readJSON(srcDockerfilePath,[]);
			let dstDockerContent = this.fs.read(dstDockerfilePath);
			for(let i = 0; i < srcDockerContent.length; i++) {
				if(dstDockerContent.indexOf(srcDockerContent[i].replace) < 0) {
					dstDockerContent = dstDockerContent.replace(srcDockerContent[i].find, srcDockerContent[i].replace);
				}
			}
			this.fs.write(dstDockerfilePath, dstDockerContent);
		}

		this._addRouters(srcNodePath, dstNodePath);
	}

	_copyFiles(srcPath, dstPath, templateContext) {
		logger.debug('Copying files recursively from', srcPath, 'to', dstPath);
		let files = Glob.sync(srcPath + '/**/*', {dot: true});
		_.each(files, function (srcFilePath) {

			// Do not process srcFilePath if it is pointing to a directory
			if (fs.lstatSync(srcFilePath).isDirectory()) return;

			// Do not process files that end in .partial, they're processed separately
			if (srcFilePath.indexOf('.partial') > 0 || srcFilePath.indexOf('.replacement') > 0) return;

			let dstFilePath = srcFilePath.replace(srcPath, dstPath);
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

	_addDependencies(serviceDepdendenciesString) {
		let serviceDependencies = JSON.parse(serviceDepdendenciesString);
		let packageJsonPath = this.destinationPath('./package.json');
		this.fs.extendJSON(packageJsonPath, serviceDependencies);
	}

	_recursiveReplaceYaml(overrideSpec,originalSpec) {
		// if the current item is a value, return.
		if(typeof overrideSpec !== 'object') {
			return;
		}

		// if the current object is an array, we check the number of items in the list.
		if(Array.isArray(originalSpec)) {
			// if it doesn't match, throw an error.
			if(!Array.isArray(overrideSpec) || originalSpec.length !== overrideSpec.length) {
				throw 'Array length mismatch. You should consider replacing the whole file if you are making changes like that';
			}

			// if it matches, iterate.
			for(let i = 0; i < originalSpec.length; i++) {
				// check deeper if there's something to override, else just replace with original.
				if(overrideSpec[i]) {
					this._recursiveReplaceYaml(overrideSpec[i], originalSpec[i]);
				} else {
					overrideSpec[i] = originalSpec[i];
				}
			}

			return;
		}

		// if the current originalSpec is an object, we iterate through its key value pairs.
		if(typeof originalSpec === 'object') {
			for(let key in originalSpec) {
				// check deeper if there is something to override, else just add original
				if(overrideSpec && overrideSpec[key]) {
					this._recursiveReplaceYaml(overrideSpec[key], originalSpec[key]);
				} else {
					overrideSpec[key] = originalSpec[key];
				}
			}
		}

		return;
	}

	_addOverrideYaml(overrideSpec, originalYamlPath) {
		if (overrideSpec) {
			let originalYamlSpec;
			if (this.fs.exists(originalYamlPath)) {
				originalYamlSpec = yaml.safeLoad(this.fs.read(originalYamlPath));
			}
			if (originalYamlSpec) {
				this._recursiveReplaceYaml(overrideSpec, originalYamlSpec);
			}
			let regex = new RegExp(/'\$\{/, 'g');
			let regex1 = new RegExp("}'\n", 'g'); // eslint-disable-line

			this.fs.write(originalYamlPath, '---\n' + yaml.safeDump(overrideSpec, {
				'styles': {
					'!!null': 'lowercase',
					'!!boolean': 'lowercase'
				},
				'skipInvalid': true
			})
				.replace(regex, '${')
				.replace(regex1, '}\n'));	// library adds ' to strings like ${CF_APP_NAME}, so remove them for mustache replacement
		}
	}

	_addRouters(srcNodePath, dstNodePath) {
		srcNodePath += '/server/routers';
		let routersIndexJsFilePath = dstNodePath + '/server/routers/index.js';
		if (!this.fs.exists(routersIndexJsFilePath)) {
			logger.warn(routersIndexJsFilePath, 'not found, can\'t inject routers.');
			return;
		}

		let files = Glob.sync(srcNodePath + '/*.js');
		_.each(files, function (routerFilePath) {
			let routerFileName = routerFilePath.replace(srcNodePath, '').replace('.js', '');
			let routersIndexJsFileContent = this.fs.read(routersIndexJsFilePath);
			if (routersIndexJsFileContent.indexOf('public') > -1 && routerFileName.indexOf('public') > -1) {
				return; // Do not add public.js router more than once
			}

			let contentToAdd = '    require(\'.' + routerFileName + '\')(app, server);\n};';
			routersIndexJsFileContent = routersIndexJsFileContent.replace('};', contentToAdd);
			this.fs.write(routersIndexJsFilePath, routersIndexJsFileContent);
		}.bind(this));
	}
};
