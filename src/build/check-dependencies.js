/* @flow */

import fs from 'fs';
import assert from 'assert';
import semver from 'semver';
import path from 'path';
import escapeShellArg from './escape-shell-arg';

function checkDependency(version: string, depname: string) {
  const depPackage = (require: any)(depname+'/package.json');
  if (!semver.satisfies(depPackage.version, version)) {
    throw new Error(
      "Dependency "+depname+" is at version "+depPackage.version+
      ", but "+version+" is required."
    );
  }
}

function checkDependenciesRecursive(packagePath: string[], shrinkWrapEntry: Object) {
  if (shrinkWrapEntry.optional) return;
  const packageObj = (require: any)(packagePath.join('/node_modules/')+'/package.json');
  // Don't check our own version number.
  if (packagePath.length != 1) {
    assert.strictEqual(packageObj.version, shrinkWrapEntry.version);
    if (packageObj.integrity != null) {
      assert.strictEqual(packageObj.integrity, shrinkWrapEntry.integrity);
    }
  }
  Object.entries(shrinkWrapEntry.dependencies || {}).forEach(([depname, shrinkwrapSubEntry]) => {
    checkDependenciesRecursive(packagePath.concat([depname]), (shrinkwrapSubEntry:any));
  });
}

function checkDependencies(packageObj: Object) {
  try {
    const shrinkWrapPath = __dirname+'/../../npm-shrinkwrap.json';
    if (fs.existsSync(shrinkWrapPath)) {
      const shrinkWrap = (require: any)(shrinkWrapPath);
      checkDependenciesRecursive([__dirname+'/../../'], shrinkWrap);
    } else {
      Object.entries(packageObj.dependencies || {})
        .concat(Object.entries(packageObj.devDependencies || {}))
        .forEach(([depname, version]) => {
          checkDependency((version:any), depname);
        });
    }
  } catch(e) {
    const pjDir = path.join(__dirname, '../..');
    console.error( //eslint-disable-line no-console
      "Dependencies check failed. To fix, run:\n" +
      "    (cd "+escapeShellArg(pjDir)+" && rm -rf node_modules && npm install)"
    );
    throw e;
  }
}

module.exports = checkDependencies;
