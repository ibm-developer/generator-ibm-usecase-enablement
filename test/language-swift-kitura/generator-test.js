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

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const helpers = require('yeoman-test');

const GENERATORS_PATH = path.join(__dirname, '..', '..', 'generators');
const MAIN_GENERATOR_PATH = path.join(GENERATORS_PATH, 'app', 'index.js');
const INIT_GENERATOR_PATH = path.join(GENERATORS_PATH, 'init', 'index.js');
const FALLBACK_BLUEMIX_PATH = path.join('..', 'resources', 'fallback_bluemix.js');
const APP_ROUTES_PATH = path.join(GENERATORS_PATH, 'init', 'templates', 'src', 'swift-kitura', 'Sources', 'Application', 'Routes', 'AppRoutes.swift');
const SAMPLE_PATH = path.join(GENERATORS_PATH, 'init', 'templates', 'src', 'swift-kitura', 'Sources', 'Application', 'Misc', 'Sample.swift');

describe('generator-usecase-enablement:language-swift-kitura', function () {
	let swiftBuildDir;

	let bluemixJSON = JSON.parse(require(FALLBACK_BLUEMIX_PATH));
	bluemixJSON.backendPlatform = 'SWIFT';

	const dependencies = [];

	before(function () {
		return helpers.run(INIT_GENERATOR_PATH)
			.inTmpDir()
			.then(function (dir) {
				swiftBuildDir = path.join(dir, 'build');
				fs.mkdirSync(swiftBuildDir);

				swiftBuildDir = path.join(swiftBuildDir, 'swift-kitura');
				fs.mkdirSync(swiftBuildDir);
			});
	});

	it('creates usecase folders and files for swift-kitura', function () {
		return helpers.run(MAIN_GENERATOR_PATH)
			.inDir(swiftBuildDir)
			.withOptions({
				force: true,
				bluemix: JSON.stringify(bluemixJSON),
				parentContext: {
					injectDependency: function(dependency) {
						dependencies.push(dependency);
					}
				}
			})
			.then(function () {
				assert.file(['Sources/Application/Routes/AppRoutes.swift']);
				assert.fileContent('Sources/Application/Routes/AppRoutes.swift', fs.readFileSync(APP_ROUTES_PATH, 'utf8'));
				assert.file(['Sources/Application/Misc/Sample.swift']);
				assert.fileContent('Sources/Application/Misc/Sample.swift', fs.readFileSync(SAMPLE_PATH, 'utf8'));
				assert.equal(1, dependencies.length);
			});
	});
});