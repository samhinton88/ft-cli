#!/usr/bin/env node
import { argv } from 'yargs';
import fetch from 'cross-fetch';
import { API_ROOT } from "./config";
import { SnippetInterface, templateExecutionService } from './services';
import { writeFileWithDirPath } from './utils';

const bareWords = (argv as any)._;
const args = argv;

const run = async () => {
  const [name, mode] = bareWords;
  console.log({ name, mode })
  
  if (!name) return 

  const isPublic = ['welcome'].includes(name);
  
  let res;

  if (isPublic) {
    res = await fetch(
      API_ROOT + '/public/templates/one?name=' + name
    ).then(d => d.json());  
  } else {
    res = await fetch(
      API_ROOT + '/public/templates/one?name=' + name
    ).then(d => d.json());
  }


  // console.log(res);
  if (!res) {
    console.log('No template found with name: ' + name)
    return
  };

  const { snippets, parameters } = res;

  const done = await Promise.all(
    snippets.map((snippet: SnippetInterface) =>
      templateExecutionService.generateSnippet(snippet, parameters, args)));

      
  const snippetsWithTargets = done.map((snippet: any, i) => ({ ...snippet, target: snippets[i].target }))
  
  // console.log(snippetsWithTargets);
  if (mode === '_demo') {
    snippetsWithTargets.forEach((snippet) => {
      console.log(`${snippet.target}
${snippet.localSnippet}`)
    })
  } else {
    await Promise.all(snippetsWithTargets.map((snippet) => {
      return snippet.target === 'stdout' 
        ? console.log(snippet.localSnippet) 
        : writeFileWithDirPath('./' + snippet.target, snippet.localSnippet)
    }));
  }

}

run()
