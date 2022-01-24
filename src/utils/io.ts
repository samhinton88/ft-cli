import { promisify } from "util"
import { writeFile as wff, mkdir as mkd } from "fs"
import path from "path";

const wf = promisify(wff);
const mkdir =promisify(mkd)

export const writeFile = async (path: string, data: string) => {
  await wf(path, data)
}

export const writeFileWithDirPath = async (pathString: string, data: string) => {
  await mkdir(path.dirname(pathString), { recursive: true })  
  await wf(pathString, data)
}