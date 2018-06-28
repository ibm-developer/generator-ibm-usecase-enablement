'use strict';

const fs = require('fs-extra');
const path = require('path');
const assert = require('assert');
const helpers = require('yeoman-test');
const constants = require('../resources/constants');

const GENERATORS_PATH = path.join(__dirname, '..', '..', 'generators');
const MAIN_GENERATOR_PATH = path.join(GENERATORS_PATH, 'app', 'index.js');
const INIT_GENERATOR_PATH = path.join(GENERATORS_PATH, 'init', 'index.js');
const FALLBACK_BLUEMIX_PATH = path.join('..', 'resources', 'fallback_bluemix.js');
const HTML_PATH = path.join(GENERATORS_PATH, 'init', 'templates', 'src', 'public', 'index.html');
const GIT_IGNORE_PARTIAL_PATH = path.join(GENERATORS_PATH, 'init', 'templates', 'src', 'node-express', '.gitignore.partial');
const PACKAGE_JSON_PARTIAL_PATH = path.join(GENERATORS_PATH, 'init', 'templates', 'src', 'node-express', 'package.json.partial');
const MANIFEST_YAML_PARTIAL_PATH = path.join(GENERATORS_PATH, 'init', 'templates', 'src', 'node-express', 'manifest.yml.partial');
const USECASE_ROUTER_PATH = path.join(GENERATORS_PATH, 'init', 'templates', 'src', 'node-express', 'server', 'routers', 'usecase-router.js');

let options;

describe('generator-usecase-enablement:language-node-express', function () {
	let nodeBuildDir;
	before(function () {
		let bluemixJSON = JSON.parse(require(FALLBACK_BLUEMIX_PATH));
		bluemixJSON.backendPlatform = 'NODE';

		options = {};
		options[constants.OPTION_BLUEMIX] = JSON.stringify(bluemixJSON);
		options['localsrc'] = true;

		return helpers.run(INIT_GENERATOR_PATH)
			.inTmpDir()
			.then(function (dir) {
				nodeBuildDir = path.join(dir, 'build');
				fs.mkdirSync(nodeBuildDir);
				nodeBuildDir = path.join(nodeBuildDir, 'node-express');
				fs.mkdirSync(nodeBuildDir);
			});
	});

	it('creates the init folders and files', function () {
		assert.file(['.gitignore', '.npmignore', 'bluemix.json', 'blueprint.json', 'starter.json']);
		assert.file(['blueprint/appicon.svg', 'blueprint/thumbnail.svg', 'src/public/index.html',
			'src/node-express/.gitignore.partial', 'src/node-express/package.json.partial', 'src/node-express/server/routers/usecase-router.js',
			'src/python-flask/.gitignore.partial', 'src/python-flask/requirements.txt.partial', 'src/python-flask/server/routes/usecase_route.py',
		]);

		assert.equal(true, fs.existsSync(nodeBuildDir));
	});

	it('creates usecase folders and files for node-express', function () {
		return helpers.run(MAIN_GENERATOR_PATH)
			.inDir(nodeBuildDir, (nodeBuildDir) => {
				fs.copySync(path.join(__dirname, 'resources', 'Dockerfile'), path.join(nodeBuildDir, 'Dockerfile'));
				fs.copySync(path.join(__dirname, 'resources', 'manifest.yml'), path.join(nodeBuildDir, 'manifest.yml'));
			})
			.withOptions(options)
			.then(function () {
				assert.file(['package.json', '.gitignore', 'manifest.yml', 'Dockerfile']);
				assert.file(['public/index.html']);
				assert.file(['server/routers/usecase-router.js']);
				assert.fileContent('.gitignore', fs.readFileSync(GIT_IGNORE_PARTIAL_PATH, 'utf8'));
				assert.fileContent('manifest.yml', 'disk_quota: 1024M');
				assert.fileContent('manifest.yml', 'command: npm prune --production && NODE_ENV=production npm start');
				assert.fileContent('manifest.yml', 'NPM_CONFIG_PRODUCTION: false');
				assert.fileContent('manifest.yml', 'timeout: 180');
				assert.jsonFileContent('package.json', JSON.parse(fs.readFileSync(PACKAGE_JSON_PARTIAL_PATH, 'utf8')));
				assert.fileContent('public/index.html', fs.readFileSync(HTML_PATH, 'utf8'));
				assert.fileContent('server/routers/usecase-router.js', fs.readFileSync(USECASE_ROUTER_PATH, 'utf8'));
				assert.fileContent('Dockerfile', 'npm run build;');
			});
	});
});
