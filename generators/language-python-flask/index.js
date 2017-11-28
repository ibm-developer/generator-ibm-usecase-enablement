'use strict';

const Log4js = require('log4js');
const logger = Log4js.getLogger("generator-service-enablement:language-python-flask");
const Glob = require('glob');
const _ = require('lodash');
const minimatch = require('minimatch');
const path = require('path');
const fs = require('fs');

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
		let srcPythonPath = srcRoot + "/python-flask";
		let srcSharedPath = srcRoot + "/shared";

		let dstRoot = this.destinationPath();
		let dstPublicPath = dstRoot + "/public";
		let dstPythonPath = dstRoot;

		let templateContext = {
			bluemix: this.context.bluemix
		};

		// Copy /src/shared
		if (fs.existsSync(srcSharedPath)){
			logger.debug("Copying shared files from", srcSharedPath);
			this._copyFiles(srcSharedPath, dstPythonPath, templateContext);
		}

		// Copy /src/public
		if (fs.existsSync(srcPublicPath)){
			logger.debug("Copying public files from", srcPublicPath);
			this._copyFiles(srcPublicPath, dstPublicPath, templateContext);
		}

		// Copy /src/node-express
		if (fs.existsSync(srcPythonPath)){
			logger.debug("Copying python-flask files from", srcPythonPath);
			this._copyFiles(srcPythonPath, dstPythonPath, templateContext);
		}

		// Process requirements.txt.partial
		let srcRequirementsTxtPartialPath = srcPythonPath + "/requirements.txt.partial";
		if (this.fs.exists(srcRequirementsTxtPartialPath)) {
			this._addDependencies(this.fs.read(srcRequirementsTxtPartialPath));
		}

		// Process .gitignore.partial
		let srcGitIgnorePartialPath = srcPythonPath + "/.gitignore.partial";
		let dstGitIgnorePath = dstRoot + "/.gitignore";
		if (this.fs.exists(srcGitIgnorePartialPath)) {
			let srcGitIgnorePartialContent = this.fs.read(srcGitIgnorePartialPath);
			if (this.fs.exists(dstGitIgnorePath)) {
				this.fs.append(dstGitIgnorePath, srcGitIgnorePartialContent);
			} else {
				this.fs.write(dstGitIgnorePath, srcGitIgnorePartialContent);
			}
		}

		this._addRouters(srcPythonPath, dstPythonPath);
	}

	_copyFiles(srcPath, dstPath, templateContext) {
		logger.debug("Copying files recursively from", srcPath, "to", dstPath);
		let files = Glob.sync(srcPath + "/**/*", {dot: true});
		_.each(files, function (srcFilePath) {

			// Do not process srcFilePath if it is pointing to a directory
			if (fs.lstatSync(srcFilePath).isDirectory()) return;

			// Do not process files that end in .partial, they're processed separately
			if (srcFilePath.indexOf(".partial") > 0) return;

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
		let requirementsTxtPath = this.destinationPath("./requirements.txt");
		if (this.fs.exists(requirementsTxtPath)) {
			this.fs.append(requirementsTxtPath, serviceDepdendenciesString);
		} else {
			this.fs.write(requirementsTxtPath, serviceDepdendenciesString);
		}
	}

	_addRouters(srcPythonPath, dstPythonPath) {
		srcPythonPath += "/server/routes";
		let routesInitFilePath = dstPythonPath + "/server/routes/__init__.py";

		let importModulesString =
			`from os.path import dirname, basename, isfile
import glob
modules = glob.glob(dirname(__file__)+"/*.py")
__all__ = [ basename(f)[:-3] for f in modules if isfile(f) and not f.endswith('__init__.py')]`;

		if (!this.fs.exists(routesInitFilePath)) {
			this.fs.write(routesInitFilePath, importModulesString);
		} else {
			let initFileContent = this.fs.read(routesInitFilePath);
			if (initFileContent.indexOf(importModulesString) === -1) {
				this.fs.append(routesInitFilePath, importModulesString);
			}
		}
	}
};
