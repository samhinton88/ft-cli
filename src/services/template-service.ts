import { resolvers } from 'fetch-snippet-templater';
import prettier, { RequiredOptions } from 'prettier'
import expand from 'emmet'
import phpPlugin from '@prettier/plugin-php';


const phpPostProcessor = (code: string) => {
  return prettier.format(code,{ 
    parser: 'php',
    plugins: [phpPlugin]
  })
}

const baseParserConfig = { singleQuote: true, trailingComma: 'es5' as RequiredOptions['trailingComma'] };

const postProcessors: { [key: string]: (d: string) => string} = {
  vue: code => prettier.format(code, { ...baseParserConfig, parser: 'vue' }),
  js: code => prettier.format(code, { ...baseParserConfig, parser: 'flow' }),
  html: code => prettier.format(code, { ...baseParserConfig, parser: 'html' }),
  css: code => prettier.format(code, { ...baseParserConfig, parser: 'css' }),
  typescript: code =>
    prettier.format(code, { ...baseParserConfig, parser: 'typescript' }),
  markdown: code =>
    prettier.format(code, { ...baseParserConfig, parser: 'markdown' }),
  json: s => prettier.format(s, { ...baseParserConfig, parser: 'json' }),
  php: phpPostProcessor,
  emmet: s => expand(s),
  none: s => s
};

export interface Parameter {
  name: string;
  defaultValue?: string;
  exampleValue: string;
}

export interface SnippetInterface {
  target: string;
  language: string;
  content: string;
  postProcess: string;
}

export interface TemplateInterface {
  owner: string; // Types.ObjectId;
  snippets: SnippetInterface[];
  parameters: Parameter[];
  name: string;
  documentation: string;
  tags: string[];
}


export const templateExecutionService = {
  generateSnippet: async (snippet: SnippetInterface, params: Parameter[],  args: any) => {
    const argsWithDefaults = params.reduce((acc, param) => {
      if (param.defaultValue) {
        acc[param.name] = acc[param.name] || param.defaultValue;
        return acc;
      }

      return acc;
    }, args);

    const snippetData = { 
      template: snippet.content,
      params,
      args: { filePath: './', dirPath: './', ...argsWithDefaults },
      postProcess: postProcessors[snippet.language] 
    }

    const res = await resolvers.mapResolver(snippetData, () => {},[])

    if (res.postProcess) {
      res.localSnippet = res.postProcess(res.localSnippet);
    }

    snippet.target = (await resolvers.mapResolver({ 
      template: snippet.target,
      params,
      args: { filePath: './', dirPath: './', ...argsWithDefaults },
      postProcess: null
    })).localSnippet;


    return res;
  }
}