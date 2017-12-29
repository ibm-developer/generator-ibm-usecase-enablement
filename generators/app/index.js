/*
 * Copyright IBM Corporation 2017
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
const logger = Log4js.getLogger("generator-usecase-enablement");
const Bundle = require("./../../package.json")
const Shell = require('shelljs');
const Guid = require('guid');
const fs = require('fs');
const Request = require('request');
const Q = require('q');
const Generator = require('yeoman-generator');

const OPTION_BLUEMIX = "bluemix";
const OPTION_STARTER = "starter";
const OPTION_STARTER_OPTIONS = "starterOptions";
const DEFAULT_LOG_LEVEL = "INFO";
const DEFAULT_LOCAL_SRC = '../../src';

module.exports = class extends Generator {
	constructor(args, opts) {
		super(args, opts);
		this._setLoggerLevel();
		logger.debug(">>> constructor");
		logger.info("Package info ::", Bundle.name, Bundle.version);

		//logger.debug(this.options);

		this.option(OPTION_BLUEMIX, {
			description: "Project configuration received from Scaffolder. Stringified JSON object.",
			type: String
		});

		this.option(OPTION_STARTER, {
			description: "Starter configuration received from Scaffolder, as defined in blueprint.json.",
			type: String
		});

		this.option(OPTION_STARTER_OPTIONS, {
			description: "starterOptions from Scaffolder. Stringified JSON object",
			type: String
		});

		this.parentContext = opts.parentContext;			//parent context if being composed by another generator
	}

	intializing() {
		logger.debug(">>> initializing");
		this._sanitizeOption(this.options, OPTION_BLUEMIX);
		this._sanitizeOption(this.options, OPTION_STARTER);
		this._sanitizeOption(this.options, OPTION_STARTER_OPTIONS);

		let deferred = Q.defer();
		
		let context = this.parentContext || {};
		//add bluemix options from this.options to existing bluemix options on parent context
		context[OPTION_BLUEMIX] = Object.assign(context[OPTION_BLUEMIX] || {}, this.options[OPTION_BLUEMIX]);
		context[OPTION_STARTER] = this.options[OPTION_STARTER];
		context[OPTION_STARTER_OPTIONS] = this.options[OPTION_STARTER_OPTIONS];
		context.loggerLevel = logger.level;
		context.language = context.bluemix.backendPlatform.toLowerCase();
		let localsrc = this.options[OPTION_STARTER_OPTIONS];
		if(typeof (localsrc) !== "object") {
			context.localsrc = (typeof localsrc === 'string') && localsrc.length ? localsrc : DEFAULT_LOCAL_SRC;
		}

		this._getStarterKitSourcesPath(this, context)
			.then((starterKitSourcesPath) => {
				try {
					fs.accessSync(starterKitSourcesPath);
					logger.info("StarterKit sources found at", starterKitSourcesPath);
				} catch (e) {
					logger.fatal("Can't find StarterKit sources at", starterKitSourcesPath);
					return deferred.reject("Can't find StarterKit sources at " + starterKitSourcesPath);
				}
				context.starterKitSourcesPath = starterKitSourcesPath;

				// Load EJS exclude patterns
				try {
					let blueprintJson = this.fs.readJSON(starterKitSourcesPath + "/../blueprint.json");
					this.ejsExcludePatterns = blueprintJson.ejsExcludePatterns;
					logger.debug("Loaded ejsExcludePatterns", this.ejsExcludePatterns);
				} catch (e) {
					logger.warn("Failed to retrieve ejsExcludePatterns from blueprint.json");
				}
				context.ejsExcludePatterns = this.ejsExcludePatterns || [];
				logger.debug("context.ejsExcludePatterns === ", context.ejsExcludePatterns);

				let languageGeneratorPath;
				switch (context.language) {
					case "node":
						languageGeneratorPath = '../language-node-express';
						break;
					case "python":
						languageGeneratorPath = '../language-python-flask';
						break;
					case "java":
						languageGeneratorPath = '../language-java';
						context.language = 'java-liberty';
						break;
					case "spring":
						languageGeneratorPath = '../language-java';
						context.language = 'java-spring';
						break;
					case "swift":
						languageGeneratorPath = '../language-swift-kitura';
						break;
				}

				logger.info("Composing with", languageGeneratorPath)
				this.composeWith(require.resolve(languageGeneratorPath), {context: context});
				deferred.resolve();
			})
			.fail((err) => {
				deferred.reject(err);
			});

		return deferred.promise;
	}

	configuring() {
		logger.debug(">>> configuring");
	}

	writing() {
		logger.debug(">>> writing");
	}

	end() {
		logger.debug(">>> end");
		if (this.tempDirectoryPath) {
			logger.info("Deleting temp directory", this.tempDirectoryPath);
			Shell.rm('-rf', this.tempDirectoryPath);
		}
	}

	_getStarterKitSourcesPath(generator, generationContext) {
		logger.debug(">>> _getStarterKitSourcesPath");
		logger.debug("context.localsrc ==", generationContext.localsrc);
		let deferred = Q.defer();

		let starterKitSourcesPath;
		if (generationContext.localsrc) {
			starterKitSourcesPath = this.destinationPath(generationContext.localsrc);
			return Q.resolve(starterKitSourcesPath);
		} else {
			let downloadURL = generationContext[OPTION_STARTER_OPTIONS].downloadURL;
			let authToken = generationContext[OPTION_STARTER_OPTIONS].objectStorageAuthToken;
			logger.info("Loading remote starterkit from", downloadURL);
			let tempDirectoryPath = (process.env.TMPDIR ? process.env.TMPDIR : "/tmp/") + Guid.raw();
			generator.tempDirectoryPath = tempDirectoryPath; // Save for eventual clean up
			Shell.mkdir(tempDirectoryPath);
			let tempFilePath = tempDirectoryPath + "/starterkit.zip";
			logger.debug("tempFilePath ::", tempFilePath);

			let responseContentLength;
			let receivedContentLength = 0;
			Request
				.get(downloadURL, {
					headers: {
						"X-Auth-Token": authToken
					}
				})
				.on('request', () => {
					logger.debug('Starting download')
				})
				.on('response', (resp) => {
					logger.debug('Got response with statusCode', resp.statusCode)
					responseContentLength = parseInt(resp.headers["content-length"]);
					if (resp.statusCode !== 200) {
						return deferred.reject("Failed to download StarterKit from " + downloadURL);
					}
				})
				.on('data', (data) => {
					receivedContentLength += data.length;
					let downloadedPercent = parseInt(receivedContentLength / responseContentLength * 100) + "%";
					logger.debug('Downloaded', receivedContentLength, downloadedPercent);
				})
				.on('error', (err) => {
					console.error("Failed to download", err);
					return deferred.reject("Failed to download StarterKit from " + downloadURL);
				})
				.pipe(fs.createWriteStream(tempFilePath))
				.on('close', () => {
					logger.info("Download complete");
					if (!generator.fs.exists(tempFilePath)) {
						logger.fatal("Failed to download StarterKit from", downloadURL);
						return deferred.reject("Failed to download StarterKit from " + downloadURL);
					} else {
						logger.info("Successfully downloaded StarterKit from", downloadURL);
					}
						Shell.exec("unzip " + tempFilePath + " -d " + tempDirectoryPath, {async: true}, () => {
						Shell.rm(tempFilePath);
						tempDirectoryPath += "/" + Shell.ls(tempDirectoryPath).stdout.trim();
						starterKitSourcesPath = tempDirectoryPath + "/src";
						return deferred.resolve(starterKitSourcesPath);
					});
				});
		}

		return deferred.promise;
	}

	_setLoggerLevel(){
		let level = (process.env.GENERATOR_LOG_LEVEL || DEFAULT_LOG_LEVEL).toUpperCase();
		logger.info("Setting log level to", level);
		/* istanbul ignore else */      //ignore for code coverage as the else block will set a known valid log level
		if(Log4js.levels.hasOwnProperty(level)) {
			logger.setLevel(Log4js.levels[level]);
		} else {
			logger.warn("Invalid log level specified (using default) : " + level);
			logger.setLevel(DEFAULT_LOG_LEVEL.toUpperCase());
		}
	}

	_sanitizeOption(options, name) {
		let optionValue = options[name];
		if (!optionValue) {
			return logger.error("Missing", name, "parameter");
		}

		if (optionValue.indexOf("file:") === 0) {
			let fileName = optionValue.replace("file:", "");
			let filePath = this.destinationPath("./" + fileName);
			logger.info("Reading", name, "parameter from local file", filePath);
			this.options[name] = this.fs.readJSON(filePath);
			return;
		}

		try {
			this.options[name] = typeof(this.options[name]) === "string" ?
				JSON.parse(this.options[name]) : this.options[name];
		} catch (e) {
			logger.error(e);
			throw name + " parameter is expected to be a valid stringified JSON object";
		}
	}
};
