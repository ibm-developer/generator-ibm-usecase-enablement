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

/**
 * This generator mocks the Java generator which is the one that is invoking the
 * use-case generator when run in production
 */


const Generator = require('yeoman-generator');
const path = require('path');
const handlebars = require('handlebars');
const javaGenerator = require('../../../generators/language-java/index');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.conf = Object.assign({}, opts);
    this.conf.createType = "build";
    this.values = {
      parentContext : {
        bluemix : { backendPlatform : opts.backendPlatform },
        _addDependencies : opts.callback,
        usecaseContext : {
          
        }
      },
      bluemix : "{}",
      starter : '"local"',
      starterOptions : opts.starterOptions
    }
  }

  initializing(){
    const filePath = path.join(__dirname, "..", "..", "..", "generators", "app", "index.js");
    this.composeWith(filePath, this.values);
  }

  writing(){

  }
}
