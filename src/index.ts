#!/usr/bin/env node
import yargs, { argv } from "yargs";
import fetch from "cross-fetch";
import open from "open";
import inquirer from "inquirer";
import { API_ROOT } from "./config";
import {
  SnippetInterface,
  templateExecutionService,
  workflowService,
} from "./services";
import {
  buildTree,
  questionnaireInterpret,
  toDirectoryTree,
  writeFileWithDirPath,
} from "./utils";

const loopPrompt = async (
  ...instructions: { func: (d: any) => void; message: string }[]
) => {
  const [next, ...rest] = instructions;
  const res = await inquirer.prompt([
    {
      type: "input",
      name: "input",
      prefix: "",
      message: next.message,
    },
  ]);

  await next.func(res.input);

  await loopPrompt(...rest);
};

const GITHUB_AUTHORIZE_URL = "https://github.com/login/device/code";
const GITHUB_CLIENT_ID = "e015e472a7be2fc444d0";

const bareWords = (argv as any)._;
const args = argv as any;

const run = async () => {
  const [name, mode, subMode] = bareWords;

  if (!name) return;

  if (name === "login") {
    const { email, password } = args;
    if (!email)
      return console.log(
        "Please provide an email: --email my.email@example.com"
      );
    if (!password)
      return console.log("Please provide a password: --password secret1234");

    const res = await fetch(API_ROOT + "/users/authenticate", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: { "Content-Type": "application/json" },
    }).then((d) => d.json());

    console.log("Logged in!");

    return await writeFileWithDirPath(
      __dirname + "/creds/auth.json",
      JSON.stringify(res, null, 2)
    );
  }

  if (name === "github-login") {
    const res = await fetch(
      GITHUB_AUTHORIZE_URL +
        "?client_id=" +
        GITHUB_CLIENT_ID +
        "&scope=user:email",
      {
        method: "POST",
      }
    ).then((d) => d.text());

    console.log(res);
    const params = new URLSearchParams(res);

    const userCode = params.get("user_code");
    const deviceCode = params.get("device_code");

    await loopPrompt(
      {
        message:
          "Fetch template will now open your default browser window, when prompted enter code: " +
          userCode +
          " proceed? (y/n)",
        func: async (answer) => {
          if (answer.toLowerCase() === "y") {
            open("https://github.com/login/device");
          } else {
            process.exit(0);
          }
        },
      },
      {
        message: "When you've authorised in the browser, press any key",
        func: async (answer) => {
          const res = await fetch(
            "https://github.com/login/oauth/access_token" +
              "?client_id=" +
              GITHUB_CLIENT_ID +
              "&device_code=" +
              deviceCode +
              "&grant_type=urn:ietf:params:oauth:grant-type:device_code",
            {
              method: "POST",
              headers: { Accept: "application/json" },
            }
          ).then((d) => d.json());

          const user = await fetch(API_ROOT + "/users/authenticate-github", {
            method: "POST",
            body: JSON.stringify({ access_token: res.access_token }),
            headers: { "Content-Type": "application/json" },
          }).then((d) => d.json());

          await writeFileWithDirPath(
            __dirname + "/creds/auth.json",
            JSON.stringify(
              { isGitHub: true, userId: user._id, ...res },
              null,
              2
            )
          );

          console.log("Logged in with GitHub, email: ", user.email);
          process.exit(0);
        },
      }
    );

    return;
  }

  const isPublic = ["welcome"].includes(name);
  const creds: any = require("./creds/auth.json");

  if (!isPublic && !creds) return console.log("Please login with ft login");
  const headers: any = creds.isGitHub
    ? { "X-GH-AUTH": creds.access_token }
    : { Authority: creds.token };

  if (name === "flow") {
    if (mode === 'list') {

      const flows = await workflowService.findAllByOwner({ owner: creds.userId });

      flows.forEach((flow: any) => console.log(flow.name));
      return
    }

    const flowName = mode;

    const fetchedWorkflow = await workflowService.findOneByName({
      name: flowName,
      owner: creds.userId,
    });

    if (!fetchedWorkflow) {
      return;
    }

    const { questionnaires, templates } = fetchedWorkflow;

    const questions = questionnaires
      .map((questionnaire) => questionnaire.questions)
      .flat();

    const args = await questionnaireInterpret(questions);

    const snippets = templates.map((t) => t.snippets).flat();
    const parameters = templates.map((t) => t.parameters).flat();

    const snippetsWithTargets = (
      await Promise.all(
        snippets.map((snippet: SnippetInterface) =>
          templateExecutionService.generateSnippet(snippet, parameters, args)
        )
      )
    ).flat();

    const tree = toDirectoryTree(snippetsWithTargets);
    const treeString = tree.map((t) => buildTree(t)).join("\n");

    if (subMode === "_demo") {
      snippetsWithTargets.forEach((snippet) => {
        console.log(`${snippet.target}
    ${snippet.localSnippet}`);
      });
    } else {
      const { confirmWrite } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirmWrite",
          message:
            "The following files and folders will be written to disc:\n" +
            treeString +
            "\n\nContinue?",
        },
      ]);

      if (!confirmWrite) {
        return;
      }
      await Promise.all(
        snippetsWithTargets.map((snippet) => {
          return snippet.target === "stdout"
            ? console.log(snippet.localSnippet)
            : writeFileWithDirPath("./" + snippet.target, snippet.localSnippet);
        })
      );
    }

    return;
  }

  // Authenticated Flow Starts Here
  try {
  } catch (error) {
    console.log(error);
  }
  let res;

  if (name === "list") {
    const res = await fetch(
      API_ROOT +
        "/templates?owner=" +
        creds.userId +
        (mode ? `&nameLike=${mode}` : ""),
      { headers }
    ).then((d) => d.json());

    console.log(`Name\tParameters\tSnippet Count`);
    console.log("-".repeat(`Name\tParameters\tSnippet Count`.length + 8));
    return res.forEach((template: any) =>
      console.log(
        template.name,
        `\t{ ${template.parameters.map((p: any) => p.name).join(", ")} }\t(${
          template.snippets.length
        })`
      )
    );
  }

  if (isPublic) {
    res = await fetch(API_ROOT + "/public/templates/one?name=" + name).then(
      (d) => d.json()
    );
  } else {
    res = await fetch(
      API_ROOT + "/templates/one?name=" + name + "&owner=" + creds.userId,
      {
        headers,
      }
    ).then((d) => d.json());
  }

  if (!res) {
    console.log("No template found with name: " + name);
    return;
  }

  const { snippets, parameters } = res;

  parameters.reduce((acc: typeof yargs, param: any) => {
    if (param.type === "stringArray") {
      yargs.array(param.name);
    }

    if (param.type === "number") {
      yargs.number(param.name);
    }

    if (param.type === "boolean") {
      yargs.boolean(param.name);
    }

    return acc;
  }, yargs);

  yargs.default(
    parameters.reduce(
      (acc: any, param: any) => ({ ...acc, [param.name]: param.type === 'stringArray' ? param.default || [] : param.default }),
      {}
    )
  );

  const snippetsWithTargets = (
    await Promise.all(
      snippets.map((snippet: SnippetInterface) =>
        templateExecutionService.generateSnippet(
          snippet,
          parameters,
          yargs.argv
        )
      )
    )
  ).flat();

  if (mode === "_demo") {
    snippetsWithTargets.forEach((snippet) => {
      console.log(`${snippet.target}
${snippet.localSnippet}`);
    });
  } else {
    await Promise.all(
      snippetsWithTargets.map((snippet) => {
        return snippet.target === "stdout"
          ? console.log(snippet.localSnippet)
          : writeFileWithDirPath("./" + snippet.target, snippet.localSnippet);
      })
    );
  }
};

run();
