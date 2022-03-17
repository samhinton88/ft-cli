import inquirer from "inquirer";
import { Question } from "../services";

const loopPrompt = async (question: Question, memo: any) => {
  const res = await inquirer.prompt([
    {
      type: "input",
      name: "input",
      prefix: "",
      message:
        question.prompt +
        "\n(add as many as you like, return an empty answer when you are finished)",
    },
  ]);

  if (res.input === "") {
    return;
  } else {
    memo.push(res.input);
    await loopPrompt(question, memo);
    return memo;
  }
};

export const questionnaireInterpret = async (workflowQuestions: Question[]) => {
  const state: Record<string, any> = {};

  for (const question of workflowQuestions) {
    if (question.dependentKey && !state[question.dependentKey]) {
      continue;
    }

    if (question.dataType === "stringArray") {
      const listMemo: any = [];
      await loopPrompt(question, listMemo);

      state[question.dataKey] = listMemo;
    } else {
      let qType = "input",
        choices: any[] = [];
      if (question.dataType === "enum") {
        qType = "list";
        choices = question.enumMembers;
      }

      if (question.dataType === "boolean") {
        qType = "confirm";
      }

      const { input } = await inquirer.prompt([
        {
          type: qType,
          name: "input",
          prefix: "",
          message: question.prompt,
          choices,
        },
      ]);

      state[question.dataKey] = input;
    }
  }

  return state;
};

export const questionnaireRun = () => {};
