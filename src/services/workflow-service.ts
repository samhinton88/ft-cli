import fetch from "cross-fetch";
import { TemplateInterface } from ".";
import { API_ROOT } from "../config";

export interface Question {
    dataKey: string;
    dataType: 'string' | 'stringArray' | 'enum' | 'number' | 'boolean';
    enumMembers: string[];
    prompt: string;
    placeholder: string;
    dependentKey: string;
  }
  
  export interface Questionnaire {
    questions: Question[];
    owner: string;
    name: string;
  }

export interface Workflow {
    owner: string;
    questionnaires: Questionnaire[];
    templates: TemplateInterface[];
    name: string;
    documentation: string;
    headline: string;
  }

export interface Workflow {

}

export const workflowService = {
  findOneByName: async ({ name, owner }: { name: string; owner: string }): Promise<Workflow | null> => {
    return await fetch(
      API_ROOT + "/workflow/one?name=" + name + "&owner=" + owner
    ).then((res) => res.json());
  },
  findAllByOwner: async ({ owner }: { owner: string }) => {
      return await fetch(
          API_ROOT + "/workflow?owner=" + owner
      ).then(res => res.json())
  }
};
