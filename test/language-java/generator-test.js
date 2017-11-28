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

/**
 * core classes for tests
 */

'use strict';
const path = require('path');
const assert = require('assert');
const yassert = require('yeoman-assert');
const helpers = require('yeoman-test');
const fs = require('fs');

const FRAMEWORKS = ['java', 'spring'];

//files to be generated
const expectedFiles = [
  'src/main/java/somefile.java',
  'src/main/resources/resource.txt',
  'src/test/java/sometest.java'
];

//files to be excluded from generation
const excludedFiles = [
  'config.json.template'
];

process.env.GENERATOR_LOG_LEVEL = 'error';

class Options {
  constructor(backendPlatform, skitPath) {
    let testFilePath = JSON.stringify(path.join(__dirname, '..', "resources-java", skitPath));
    this.values = {
      backendPlatform : backendPlatform,
      callback : this.addDependencies.bind(this),
      starterOptions : testFilePath
    }
    //these are the actual call backs made
    this.actual = {};
  }

  addDependencies(value) {
    const data = JSON.parse(value);
    if(data.dependencies) {
      this.actual.dependencies = (this.actual.dependencies || []).concat(data.dependencies);
    }
    if(data.properties) {
      this.actual.properties = (this.actual.properties || []).concat(data.properties);
    }
    if(data.jndiEntries) {
      this.actual.jndiEntries = (this.actual.jndiEntries || []).concat(data.jndiEntries);
    }
    if(data.envEntries) {
      this.actual.envEntries = (this.actual.envEntries || []).concat(data.envEntries);
    }
    if(data.frameworkDependencies) {
      this.actual.frameworkDependencies = (this.actual.frameworkDependencies || []).concat(data.frameworkDependencies);
    }
  }

  before() {
    const filePath = path.join(__dirname, "..",  "resources-java", "generator", "index.js");
    return helpers.run(filePath)
      .withOptions(this.values)
      .toPromise();
  }
}

FRAMEWORKS.forEach(framework => {
  describe(`java generator : test ${framework} `, function () {
    this.timeout(10000);
    let folder = framework == 'java' ? 'liberty' : 'spring';
    let options = new Options(framework, 'skit');
    let location = path.join(__dirname, "..",  "resources-java", "skit", 'java-' + folder, 'config.json.template');
    let expected = JSON.parse(fs.readFileSync(location));
    before(options.before.bind(options));
    it('should have generated with expected config', function() {
      assert.deepEqual(options.actual, expected, "Configuration did not match");
    });
    expectedFiles.forEach(expectedFile => {
      it('should have generated expected file ' + expectedFile, function() {
        assert.file(expectedFile);
      });
    });
    excludedFiles.forEach(exexcludeFile => {
      it('should NOT have generated excluded file ' + exexcludeFile, function() {
        assert.noFile(exexcludeFile);
      });
    });
    //check that the public static web files also turned up
    let publicRoot = (folder == 'liberty') ? path.join('src','main','webapp') 
                                       : path.join('src', 'main', 'resources', 'static');
    let index = path.join(publicRoot, 'index.html');
    it('should have generated expected file ' + index, function() {
      assert.file(index);
    });
  })
})

FRAMEWORKS.forEach(framework => {
  describe(`java generator : test config only ${framework} `, function () {
    this.timeout(10000);
    var options = new Options(framework, 'skit-configonly');
    before(options.before.bind(options));
    let folder = framework == 'java' ? 'liberty' : 'spring';
    let location = path.join(__dirname, "..",  "resources-java", "skit-configonly", 'java-' + folder, 'config.json.template');
    let expected = JSON.parse(fs.readFileSync(location));
    it('should have generated with expected config', function() {
      assert.deepEqual(options.actual, expected, "Configuration did not match");
    });
    expectedFiles.forEach(expectedFile => {
      it('should NOT have generated file ' + expectedFile, function() {
        assert.noFile(expectedFile);
      });
    });
    excludedFiles.forEach(exexcludeFile => {
      it('should NOT have generated file ' + exexcludeFile, function() {
        assert.noFile(exexcludeFile);
      });
    });
  })
});
