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
const logger = require('log4js').getLogger("generator-usecase-enablement:language-java");
const Generator = require('yeoman-generator');
const fs = require('fs');
const path = require('path');
const handlebars = require('../lib/helpers').handlebars;

const CONFIG_JSON_TEMPLATE = 'config.json.template';    //controls configuration for a give use case

module.exports = class extends Generator {
  
  constructor(args, opts) {
    super(args, opts);
    this.context = opts.context;
    logger.setLevel(this.context.loggerLevel);
  }

  configuring() {
    logger.debug(">>> configuring");
    let configFilePath = path.join(this.context.starterKitSourcesPath, this.context.language, CONFIG_JSON_TEMPLATE);
    if(fs.existsSync(configFilePath)) {
      logger.info("Setting dependencies in parent context");
      let dependenciesString = this.fs.read(configFilePath);
      var template = handlebars.compile(dependenciesString);
      dependenciesString = template(this.context.usecaseContext);
      this.context._addDependencies(dependenciesString);
    }
  }

  writing() {
    logger.debug(">>> writing");
    let self = this;
    let srcBasePath = path.join(this.context.starterKitSourcesPath, this.context.language);

    try {
      //process all files in src directory excluding config / control files
      this.fs.copy([this.templatePath(srcBasePath + "/**"),
        '!' + path.join(srcBasePath, CONFIG_JSON_TEMPLATE)
      ], this.destinationPath(), { process : function (contents, filename) {
        var compiledTemplate = handlebars.compile(contents.toString());
        return compiledTemplate(self.context.usecaseContext);
      }});
    } catch (e) {
      if(!e.message.includes("Trying to copy from a source that does not exist")) {
        //ignore empty directory errors and re-throw everything else
         /* istanbul ignore next */
        throw e;
      }
    }
   
    //now see if there are any public files to be copied into a web context
    let publicPath = path.join(this.context.starterKitSourcesPath, "public");
    if(fs.existsSync(publicPath)) {
      let destination = this.context.language == 'java-liberty' ? path.join(this.destinationPath(), 'src','main','webapp') 
                                                                : path.join(this.destinationPath(), 'src', 'main', 'resources', 'static');
      this.fs.copy(this.templatePath(publicPath + "/**"), destination, { process : function (contents, filename) {
        var compiledTemplate = handlebars.compile(contents.toString());
        return compiledTemplate(self.context.usecaseContext);
      }});
    }
  }


  end() {
    logger.debug(">>> end");
  }
}
