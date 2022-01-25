import { promisify } from "util"
import { writeFile as wff, mkdir as mkd, readFile as rf } from "fs"
import path from "path";

const wf = promisify(wff);
const readF = promisify(rf);
const mkdir =promisify(mkd);

export const writeFile = async (path: string, data: string) => {
  await wf(path, data)
}

export const readFile = async (path: string) => {
  await readF(path)
}

export const writeFileWithDirPath = async (pathString: string, data: string) => {
  await mkdir(path.dirname(pathString), { recursive: true })  
  await wf(pathString, data)
}