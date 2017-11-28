'use strict';

const Log4js = require('log4js');
const logger = Log4js.getLogger("generator-service-enablement:language-node-express");
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
		logger.setLevel(this.context.loggerLevel);
		logger.debug("Constructing");
	}

	writing() {
		let srcRoot = this.context.starterKitSourcesPath;
		let srcPublicPath = srcRoot + "/public";
		let srcNodePath = srcRoot + "/node-express";
		let srcSharedPath = srcRoot + "/shared";

		let dstRoot = this.destinationPath();
		let dstPublicPath = dstRoot + "/public";
		let dstNodePath = dstRoot;

		let templateContext = {
			bluemix: this.context.bluemix
		};

		// Copy /src/shared
		if (fs.existsSync(srcSharedPath)){
			logger.debug("Copying shared files from", srcSharedPath);
			this._copyFiles(srcSharedPath, dstNodePath, templateContext);
		}

		// Copy /src/public
		if (fs.existsSync(srcPublicPath)){
			logger.debug("Copying public files from", srcPublicPath);
			this._copyFiles(srcPublicPath, dstPublicPath, templateContext);
		}

		// Copy /src/node-express
		if (fs.existsSync(srcNodePath)){
			logger.debug("Copying node-express files from", srcNodePath);
			this._copyFiles(srcNodePath, dstNodePath, templateContext);
		}

		// Process package.json.partial
		let srcPackageJsonPartialPath = srcNodePath + "/package.json.partial";
		if (this.fs.exists(srcPackageJsonPartialPath)) {
			this._addDependencies(this.fs.read(srcPackageJsonPartialPath));
		}

		// Process manifest.yaml.partial
		let srcManifestYamlPartialPath = srcNodePath + "/manifest.yml.partial";
		if (this.fs.exists(srcManifestYamlPartialPath)) {
			try {
				this._addOverrideYaml(yaml.safeLoad(this.fs.read(srcManifestYamlPartialPath)), "./manifest.yml");
			} catch (e) {
				logger.error("Failed to parse manifest.yml.partial: " + e);
			}
		}

		// Process pipeline.yaml.partial
		let srcPipelineYamlPartialPath = srcNodePath + "/.bluemix/pipeline.yml.partial";
		if (this.fs.exists(srcPipelineYamlPartialPath)) {
			try {
				this._addOverrideYaml(yaml.safeLoad(this.fs.read(srcPipelineYamlPartialPath)), "./.bluemix/pipeline.yml");
			} catch (e) {
				logger.error("Failed to parse pipeline.yml.partial: " + e);
			}
		}

		// Process .gitignore.partial
		let srcGitIgnorePartialPath = srcNodePath + "/.gitignore.partial";
		let dstGitIgnorePath = dstRoot + "/.gitignore";
		if (this.fs.exists(srcGitIgnorePartialPath)) {
			let srcGitIgnorePartialContent = this.fs.read(srcGitIgnorePartialPath);
			if (this.fs.exists(dstGitIgnorePath)) {
				this.fs.append(dstGitIgnorePath, srcGitIgnorePartialContent);
			} else {
				this.fs.write(dstGitIgnorePath, srcGitIgnorePartialContent);
			}
		}

		// Process Dockerfile.replacement: takes [{find:"string","replace":"newString}, {find:"string1","replace":"newString1}]
		let srcDockerfilePath = srcNodePath + "/Dockerfile.replacement";
		let dstDockerfilePath = dstRoot + "/Dockerfile";
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
		logger.debug("Copying files recursively from", srcPath, "to", dstPath);
		let files = Glob.sync(srcPath + "/**/*", {dot: true});
		_.each(files, function (srcFilePath) {

			// Do not process srcFilePath if it is pointing to a directory
			if (fs.lstatSync(srcFilePath).isDirectory()) return;

			// Do not process files that end in .partial, they're processed separately
			if (srcFilePath.indexOf(".partial") > 0 || srcFilePath.indexOf(".replacement") > 0) return;

			let dstFilePath = srcFilePath.replace(srcPath, dstPath);
			let isEjsTemplate = true;
			_.each(this.context.ejsExcludePatterns, function (ejsExludePattern) {
				if (minimatch(path.basename(srcFilePath), ejsExludePattern)) {
					isEjsTemplate = false;
					return false;
				}
			});
			if (isEjsTemplate) {
				logger.debug("Copying template", srcFilePath, "to", dstFilePath);
				this.fs.copyTpl(srcFilePath, dstFilePath, templateContext);
			} else {
				logger.debug("Copying file", srcFilePath, "to", dstFilePath);
				this.fs.copy(srcFilePath, dstFilePath);
			}

		}.bind(this));
	}

	_addDependencies(serviceDepdendenciesString) {
		let serviceDependencies = JSON.parse(serviceDepdendenciesString);
		let packageJsonPath = this.destinationPath("./package.json");
		this.fs.extendJSON(packageJsonPath, serviceDependencies);
	}

	_addOverrideYaml(overrideSpec, originalYamlPath) {
		if (overrideSpec) {
			var originalYamlSpec;
			if (this.fs.exists(originalYamlPath)) {
				originalYamlSpec = yaml.safeLoad(this.fs.read(originalYamlPath))
			}
			if (originalYamlSpec) {
				for (let key in originalYamlSpec) {
					let array = originalYamlSpec[key];//array with one element=object (just the way the yaml lib parses yaml
					if (!overrideSpec[key]) { //if the override obj doesnt contain original key, then add key to override object
						overrideSpec[key] = array;
					}

				}
			}
			let regex = new RegExp(/\'\$\{/, 'g');
			let regex1 = new RegExp("}'\n", 'g');

			this.fs.write(originalYamlPath, "---\n" + yaml.safeDump(overrideSpec, {
				'styles': {
					'!!null': 'lowercase',
					'!!boolean': 'lowercase'
				},
				'skipInvalid': true
			}).replace(regex, "${").replace(regex1, "}\n"));	// library adds ' to strings like ${CF_APP_NAME}, so remove them for mustache replacement
		}
	}

	_addRouters(srcNodePath, dstNodePath) {
		srcNodePath += "/server/routers";
		let routersIndexJsFilePath = dstNodePath + "/server/routers/index.js";
		if (!this.fs.exists(routersIndexJsFilePath)) {
			logger.warn(routersIndexJsFilePath, "not found, can't inject routers.");
			return;
		}

		let files = Glob.sync(srcNodePath + "/*.js");
		_.each(files, function (routerFilePath) {
			let routerFileName = routerFilePath.replace(srcNodePath, "").replace(".js", "")
			let routersIndexJsFileContent = this.fs.read(routersIndexJsFilePath);
			if (routersIndexJsFileContent.indexOf("public") > -1 && routerFileName.indexOf("public") > -1) {
				return; // Do not add public.js router more than once
			}

			let contentToAdd = "\trequire('." + routerFileName + "')(app);\n};";
			routersIndexJsFileContent = routersIndexJsFileContent.replace("};", contentToAdd);
			this.fs.write(routersIndexJsFilePath, routersIndexJsFileContent);
		}.bind(this));
	}
};
