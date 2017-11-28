'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const helpers = require('yeoman-test');
const constants = require('../resources/constants');

const GENERATORS_PATH = path.join(__dirname, '..', '..', 'generators');
const MAIN_GENERATOR_PATH = path.join(GENERATORS_PATH, 'app', 'index.js');
const INIT_GENERATOR_PATH = path.join(GENERATORS_PATH, 'init', 'index.js');
const FALLBACK_BLUEMIX_PATH = path.join('..', 'resources', 'fallback_bluemix.js');
const HTML_PATH = path.join(GENERATORS_PATH, 'init', 'templates', 'src', 'public', 'index.html');
const GIT_IGNORE_PARTIAL_PATH = path.join(GENERATORS_PATH, 'init', 'templates', 'src', 'python-flask', '.gitignore.partial');
const REQUIREMENTS_TXT_PARTIAL_PATH = path.join(GENERATORS_PATH, 'init', 'templates', 'src', 'python-flask', 'requirements.txt.partial');
const USECASE_ROUTE_PATH = path.join(GENERATORS_PATH, 'init', 'templates', 'src', 'python-flask', 'server', 'routes', 'usecase_route.py');

let options;


describe('generator-usecase-enablement:language-python-flask', function () {
	let pythonBuildDir;
	before(function () {
		let bluemixJSON = JSON.parse(require(FALLBACK_BLUEMIX_PATH));
		bluemixJSON.backendPlatform = 'PYTHON';

		options = {};
		options[constants.OPTION_BLUEMIX] = JSON.stringify(bluemixJSON);
		options['localsrc'] = true;

		return helpers.run(INIT_GENERATOR_PATH)
			.inTmpDir()
			.then(function (dir) {
				pythonBuildDir = path.join(dir, 'build');
				fs.mkdirSync(pythonBuildDir);

				pythonBuildDir = path.join(pythonBuildDir, 'python-flask');
				fs.mkdirSync(pythonBuildDir);
			});
	});

	it('creates the init folders and files', function () {
		assert.file(['.gitignore', '.npmignore', 'bluemix.json', 'blueprint.json', 'starter.json']);
		assert.file(['blueprint/appicon.svg', 'blueprint/thumbnail.svg', 'src/public/index.html',
			'src/node-express/.gitignore.partial', 'src/node-express/package.json.partial', 'src/node-express/server/routers/usecase-router.js',
			'src/python-flask/.gitignore.partial', 'src/python-flask/requirements.txt.partial', 'src/python-flask/server/routes/usecase_route.py',
		]);

		assert.equal(true, fs.existsSync(pythonBuildDir));
	});

	it('creates usecase folders and files for python-flask', function () {
		return helpers.run(MAIN_GENERATOR_PATH)
			.inDir(pythonBuildDir)
			.withOptions(options)
			.then(function () {
				assert.file(['requirements.txt', '.gitignore']);
				assert.file(['public/index.html']);
				assert.file(['server/routes/usecase_route.py']);

				assert.fileContent('.gitignore', fs.readFileSync(GIT_IGNORE_PARTIAL_PATH, 'utf8'));
				assert.fileContent('requirements.txt', fs.readFileSync(REQUIREMENTS_TXT_PARTIAL_PATH, 'utf8'));

				assert.fileContent('public/index.html', fs.readFileSync(HTML_PATH, 'utf8'));

				assert.fileContent('server/routes/usecase_route.py', fs.readFileSync(USECASE_ROUTE_PATH, 'utf8'));

			});
	});
});