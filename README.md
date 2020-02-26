# WARNING: This repository is no longer maintained :warning:

> The functionality of this generator is now available in our [Cloud Assets Generator](https://github.com/IBM/generator-ibm-cloud-assets)

> This repository will not be updated. The repository will be kept available in read-only mode.

# IBM Usecase Enablement Yeoman Generator

[![IBM Cloud powered][img-ibmcloud-powered]][url-cloud]
[![Travis][img-travis-master]][url-travis-master]
[![Coveralls][img-coveralls-master]][url-coveralls-master]
[![Codacy][img-codacy]][url-codacy]
[![Version][img-version]][url-npm]
[![DownloadsMonthly][img-npm-downloads-monthly]][url-npm]
[![DownloadsTotal][img-npm-downloads-total]][url-npm]
[![License][img-license]][url-npm]
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

[img-ibmcloud-powered]: https://img.shields.io/badge/IBM%20Cloud-powered-blue.svg
[url-cloud]: http://bluemix.net
[url-npm]: https://www.npmjs.com/package/generator-ibm-usecase-enablement
[img-license]: https://img.shields.io/npm/l/generator-ibm-usecase-enablement.svg
[img-version]: https://img.shields.io/npm/v/generator-ibm-usecase-enablement.svg
[img-npm-downloads-monthly]: https://img.shields.io/npm/dm/generator-ibm-usecase-enablement.svg
[img-npm-downloads-total]: https://img.shields.io/npm/dt/generator-ibm-usecase-enablement.svg

[img-travis-master]: https://travis-ci.org/ibm-developer/generator-ibm-usecase-enablement.svg?branch=master
[url-travis-master]: https://travis-ci.org/ibm-developer/generator-ibm-usecase-enablement/branches

[img-coveralls-master]: https://coveralls.io/repos/github/ibm-developer/generator-ibm-usecase-enablement/badge.svg
[url-coveralls-master]: https://coveralls.io/github/ibm-developer/generator-ibm-usecase-enablement

[img-codacy]: https://api.codacy.com/project/badge/Grade/<enter-project-id>?branch=master
[url-codacy]: https://www.codacy.com/app/ibm-developer/generator-ibm-usecase-enablement

## Introduction

This generator produces content from another source such as a Git repository. Also, existing files that already exist in the destination directory can be extended via [partial files](#partial_files). The folder structure for the source repository should be like the following.

```
  src
  ├── java-liberty
  ├── java-spring
  ├── node-express
  ├── public
  ├── python-flask
  └── swift-kitura
```

* Files are seperated by each language folder except public which is shared across all langauges. Currently, supported languages are `java-liberty`, `java-spring`, `node-express`, `python-flask` and `swift-kitura`


## Pre-requisites

Install [Yeoman](http://yeoman.io)

```bash
npm install -g yo
```

## Installation

``bash
npm install -g generator-ibm-usecase-enablement
``

## Usage

Following command line arguments are supported
* `--bluemix {stringified-json}` -  used by  an internal microservice  to supply project information. For an example of a bluemix.json look at the [fallback_bluemix.js](./test/resources/fallback_bluemix.js) file.

<a name="partial_files"></a>
### Partial Files

Partial files such as *manifest.yml.partial* allows files to be extended if the file exist in the destination directory. For example, if a `package.json` file already exists it will add onto using `package.json.partial`.


The following partial file(s) are supported with examples.

* [manifest.yml.partial](./generators/init/templates/src/node-express/manifest.yml.partial)
* [package.json.partial](./generators/init/templates/src/node-express/package.json.partial)
* [.gitignore.partial](./generators/init/templates/src/node-express/.gitignore.partial)
* [requirements.txt.partial](./generators/init/templates/src/python-flask/requirements.txt.partial)
* [Package.swift.partial](./generators/init/templates/src/swift-kitura/Package.swift.partial)

### Replacement Files

Replacement files are similar to partial files except that content is replaced instead of extended. The replacement files contains a single array of JSON objects. Each object has two key-value pairs: `find` and `replace`.
The `find` key-value will search for any string that matches the exact substring and `replace` key-value will replace the content.

The following replacement file(s) are supported with examples.

* [Dockerfile.replacement](./generators/init/templates/src/node-express/Dockerfile.replacement)

## Development

Clone this repository and link it via npm

```bash
git clone https://github.com/ibm-developer/generator-ibm-usecase-enablement
cd generator-ibm-usecase-enablement
npm link
```

In a separate directory invoke the generator via

```bash
yo ibm-usecase-enablement
```

## Testing

To run the unit tests

`npm test`

To run integration tests

`npm run integration`

**Note** You will need to mock the credentials by adding a `bluemix.int.json` file. The file content should look something like the following:

```
{
  "cloudant": [
		{
			"url": "XXXX",
			"username": "XXXXX",
			"password": "XXXX",
			"serviceInfo": {
				"label": "cloudant-label",
				"name": "cloudant-name",
				"plan": "cloudant-plan"
			}
		}
	],

	"objectStorage": [
		{
			"auth_url": "XXXX",
			"domainId": "XXXXX",
			"domainName": "XXXX",
			"password": "XXXX",
			"project": "XXXXX",
			"projectId": "XXXX",
			"region": "dallas",
			"role": "admin",
			"userId": "XXXX",
			"username": "XXXX",
			"serviceInfo": {
				"label": "object-storage-label",
				"name": "object-storage-name",
				"plan": "object-storage-plan"
			}
		}
	]

}
```
## Publishing Changes

In order to publish changes, you will need to fork the repository or ask to join the `ibm-developer` org and branch off the `master` branch.

Make sure to follow the [conventional commit specification](https://conventionalcommits.org/) before contributing. To help you with commit a commit template is provide. 
Run `config.sh` to initialize the commit template to your `.git/config` or use [commitizen](https://www.npmjs.com/package/commitizen)
 
Once you are finished with your changes, run `npm test` to make sure all tests pass.

Do a pull request against `master`, make sure the build passes. A team member will review and merge your pull request.
Once merged to `master` one pull request will be created against `master`. Make sure that the CHANGELOG.md and the package.json is correct before merging the auto generated pull request. After the autogenerated 
pull request has been merged to `master` the version will be bumped and published to npm.
