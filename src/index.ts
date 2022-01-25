#!/usr/bin/env node
import { argv } from 'yargs';
import fetch from 'cross-fetch';
import { API_ROOT } from './config';
import { SnippetInterface, templateExecutionService } from './services';
import { writeFileWithDirPath } from './utils';

const bareWords = (argv as any)._;
const args = argv as any;

const run = async () => {
  const [name, mode] = bareWords;

  if (!name) return;

  if (name === 'login') {
    const { email, password } = args;
    if (!email)
      return console.log(
        'Please provide an email: --email my.email@example.com'
      );
    if (!password)
      return console.log('Please provide a password: --password secret1234');

    const res = await fetch(API_ROOT + '/users/authenticate', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: { 'Content-Type': 'application/json' },
    }).then((d) => d.json());

    return await writeFileWithDirPath(
      __dirname + '/creds/auth.json',
      JSON.stringify(res, null, 2)
    );
  }

  const isPublic = ['welcome'].includes(name);
  const creds: any = require('./creds/auth.json');

  if (!isPublic && !creds) return console.log('Please login with ft login');
  
  // Authenticated Flow Starts Here
  try {

  } catch (error) {
    console.log(error);
  }
  let res;

  if (name === 'list') {
    const res = await fetch(
      API_ROOT +
        '/templates?owner=' +
        creds.userId +
        (mode ? `&nameLike=${mode}` : ''),
      { headers: { Authority: creds.token } }
    ).then((d) => d.json());

    console.log(`Name\tParameters\tSnippet Count`);
    console.log('-'.repeat(`Name\tParameters\tSnippet Count`.length + 8));
    return res.forEach((template: any) =>
      console.log(
        template.name,
        `\t{ ${template.parameters.map((p: any) => p.name).join(', ')} }\t(${
          template.snippets.length
        })`
      )
    );
  }

  if (isPublic) {
    res = await fetch(API_ROOT + '/public/templates/one?name=' + name).then(
      (d) => d.json()
    );
  } else {
    res = await fetch(API_ROOT + '/templates/one?name=' + name, {
      headers: { Authority: creds.token },
    }).then((d) => d.json());
  }

  if (!res) {
    console.log('No template found with name: ' + name);
    return;
  }

  const { snippets, parameters } = res;

  const done = await Promise.all(
    snippets.map((snippet: SnippetInterface) =>
      templateExecutionService.generateSnippet(snippet, parameters, args)
    )
  );

  const snippetsWithTargets = done.map((snippet: any, i) => ({
    ...snippet,
    target: snippets[i].target,
  }));

  if (mode === '_demo') {
    snippetsWithTargets.forEach((snippet) => {
      console.log(`${snippet.target}
${snippet.localSnippet}`);
    });
  } else {
    await Promise.all(
      snippetsWithTargets.map((snippet) => {
        return snippet.target === 'stdout'
          ? console.log(snippet.localSnippet)
          : writeFileWithDirPath('./' + snippet.target, snippet.localSnippet);
      })
    );
  }
};

run();
