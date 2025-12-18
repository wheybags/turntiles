// added these two functions instead of using node / bun builtins as they defer closing the file,
// which is ok on linux but not on windows (read followed by write is broken as the read locks the file)
import type {FileHandle} from "fs/promises";
import fs from "fs";

export async function readWholeFileAsString(path: string): Promise<string>
{
    let f: FileHandle = await fs.promises.open(path, "r");
    try
    {
        return await f.readFile({encoding: "utf-8"});
    }
    finally
    {
        await f.close();
    }
}

export async function writeWholeFileAsString(path: string, data: string): Promise<void>
{
    let f: FileHandle = await fs.promises.open(path, "w");
    try
    {
        await f.writeFile(data);
    }
    finally
    {
        await f.close();
    }
}
