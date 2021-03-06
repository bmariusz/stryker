import * as path from 'path';
import * as fs from 'fs';
import { expect } from 'chai';
import { Config } from 'stryker-api/config';
import { File } from 'stryker-api/core';
import TypescriptConfigEditor from '../../src/TypescriptConfigEditor';
import TypescriptTranspiler from '../../src/TypescriptTranspiler';
import { CONFIG_KEY } from '../../src/helpers/keys';

describe('stryker-typescript', () => {

  let config: Config;
  let inputFiles: File[];

  beforeEach(() => {
    const configEditor = new TypescriptConfigEditor();
    config = new Config();
    config.set({
      tsconfigFile: path.resolve(__dirname, '..', '..', 'tsconfig.json'),
    });
    configEditor.edit(config);
    inputFiles = config[CONFIG_KEY].fileNames.map((fileName: string) => new File(fileName, fs.readFileSync(fileName, 'utf8')));
  });

  it('should be able to transpile itself', async () => {
    const transpiler = new TypescriptTranspiler({ config, produceSourceMaps: true });
    const outputFiles = await transpiler.transpile(inputFiles);
    expect(outputFiles.length).greaterThan(10);
  });

  it('should result in an error if a variable is declared as any and noImplicitAny = true', async () => {
    const transpiler = new TypescriptTranspiler({ config, produceSourceMaps: true });
    inputFiles[0] = new File(inputFiles[0].name, inputFiles[0].textContent + 'function foo(bar) { return bar; } ');
    return expect(transpiler.transpile(inputFiles)).rejectedWith('error TS7006: Parameter \'bar\' implicitly has an \'any\' type');
  });

  it('should not result in an error if a variable is declared as any and noImplicitAny = false', async () => {
    config.tsconfig.noImplicitAny = false;
    inputFiles[0] = new File(inputFiles[0].name, inputFiles[0].textContent + 'const shouldResultInError = 3');
    const transpiler = new TypescriptTranspiler({ config, produceSourceMaps: true });
    const outputFiles = await transpiler.transpile(inputFiles);
    expect(outputFiles).lengthOf.greaterThan(0);
  });
});
