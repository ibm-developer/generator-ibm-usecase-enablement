'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');

const GENERATOR_PATH = '../generators/init/index.js';

describe('generator-usecase-enablement:init', function () {
	it('creates files in correct folder structure', function () {
		return helpers.run(path.join(__dirname, GENERATOR_PATH))
			.inTmpDir()
			.then(function () {
				assert.file(['.gitignore', '.npmignore', 'bluemix.json', 'blueprint.json', 'starter.json']);
				assert.file(['blueprint/appicon.svg', 'blueprint/thumbnail.svg', 'src/public/index.html',
					'src/node-express/.gitignore.partial', 'src/node-express/package.json.partial', 'src/node-express/server/routers/usecase-router.js',
					'src/python-flask/.gitignore.partial', 'src/python-flask/requirements.txt.partial', 'src/python-flask/server/routes/usecase_route.py',
				]);
			});
	});

	it('creates files in root folder with correct content', function () {
		return helpers.run(path.join(__dirname, GENERATOR_PATH))
			.inTmpDir()
			.then(function () {
				assert.fileContent('.gitignore',
					fs.readFileSync(path.join(__dirname, '..', 'generators', 'init', 'templates', '_gitignore'), 'utf8'));

				assert.fileContent('.npmignore',
					fs.readFileSync(path.join(__dirname, '..', 'generators', 'init', 'templates', '.npmignore'), 'utf8'));

				assert.jsonFileContent('bluemix.json',
					JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'generators', 'init', 'templates', 'bluemix.json'), 'utf8')));

				assert.jsonFileContent('blueprint.json',
					JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'generators', 'init', 'templates', 'blueprint.json'), 'utf8')));

				assert.jsonFileContent('starter.json',
					JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'generators', 'init', 'templates', 'starter.json'), 'utf8')));
			});
	});

	it('creates file in src/public folder with correct content', function () {
		return helpers.run(path.join(__dirname, GENERATOR_PATH))
			.inTmpDir()
			.then(function () {
				assert.fileContent('src/public/index.html', fs.readFileSync(
					path.join(__dirname, '..', 'generators', 'init', 'templates', 'src', 'public', 'index.html'), 'utf8'));
			});
	});

	describe('creates files for node-express with correct content', function () {
		it('creates file in src/node-express root folder with correct content', function () {
			return helpers.run(path.join(__dirname, GENERATOR_PATH))
				.inTmpDir()
				.then(function () {
					assert.fileContent('src/node-express/.gitignore.partial', fs.readFileSync(
						path.join(__dirname, '..', 'generators', 'init', 'templates', 'src', 'node-express', '.gitignore.partial'), 'utf8'));

					assert.fileContent('src/node-express/package.json.partial', fs.readFileSync(
						path.join(__dirname, '..', 'generators', 'init', 'templates', 'src', 'node-express', 'package.json.partial'), 'utf8'));

					assert.fileContent('src/node-express/manifest.yml.partial', fs.readFileSync(
						path.join(__dirname, '..', 'generators', 'init', 'templates', 'src', 'node-express', 'manifest.yml.partial'), 'utf8'));
				});
		});

		it('creates devops files in src/node-express/.bluemix folder with correct content', function(){
			return helpers.run(path.join(__dirname, GENERATOR_PATH))
				.inTmpDir()
				.then(function (){
					assert.fileContent('src/node-express/.bluemix/pipeline.yml.partial', fs.readFileSync(
						path.join(__dirname, '..', 'generators', 'init', 'templates', 'src', 'node-express', '.bluemix', 'pipeline.yml.partial'), 'utf8'));

				});
		});

		it('creates file in src/node-express/server/routers folder with correct content', function () {
			return helpers.run(path.join(__dirname, GENERATOR_PATH))
				.inTmpDir()
				.then(function () {
					assert.fileContent('src/node-express/server/routers/usecase-router.js', fs.readFileSync(
						path.join(__dirname, '..', 'generators', 'init', 'templates', 'src', 'node-express', 'server', 'routers', 'usecase-router.js'), 'utf8'));
				});
		});
	});

	describe('creates files for python-flask with correct content', function () {
		it('creates file in src/python-flask root folder with correct content', function () {
			return helpers.run(path.join(__dirname, GENERATOR_PATH))
				.inTmpDir()
				.then(function () {
					assert.fileContent('src/python-flask/.gitignore.partial', fs.readFileSync(
						path.join(__dirname, '..', 'generators', 'init', 'templates', 'src', 'python-flask', '.gitignore.partial'), 'utf8'));

					assert.fileContent('src/python-flask/requirements.txt.partial', fs.readFileSync(
						path.join(__dirname, '..', 'generators', 'init', 'templates', 'src', 'python-flask', 'requirements.txt.partial'), 'utf8'));
				});
		});

		it('creates file in src/python-flask/server/routes folder with correct content', function () {
			return helpers.run(path.join(__dirname, GENERATOR_PATH))
				.inTmpDir()
				.then(function () {
					assert.fileContent('src/python-flask/server/routes/usecase_route.py', fs.readFileSync(
						path.join(__dirname, '..', 'generators', 'init', 'templates', 'src', 'python-flask', 'server', 'routes', 'usecase_route.py'), 'utf8'));
				});
		});
	});
});