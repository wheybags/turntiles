import path from "path";
import fs from "fs";
import {formatDate} from "../common/Common.ts";
import {generateBoard} from "./Generator.ts";
import {readWholeFileAsString, writeWholeFileAsString} from "./ServerMisc.ts";

async function generateDailyMain() : Promise<number>
{
    let rootPath= path.dirname(__filename);
    while (!fs.existsSync(rootPath + "/site"))
        rootPath = path.dirname(rootPath);

    const puzzlesPath: string = rootPath + "/site/puzzles.json";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let puzzles: Record<string, string> = {};
    if (await Bun.file(puzzlesPath).exists())
    {
        const backupsFolder: string = rootPath + "/puzzles_bak";
        await fs.promises.mkdir(backupsFolder, {recursive: true});
        fs.promises.copyFile(puzzlesPath, backupsFolder + "/puzzles-bak-" + formatDate(today) + "-" + crypto.randomUUID() + ".json");

        puzzles = JSON.parse(await readWholeFileAsString(puzzlesPath));
    }

    function addOneDay(date: Date)
    {
        const d = new Date(date);
        d.setDate(d.getDate() + 1); // this is clever enough to deal with month wrapping apparently, but +2 doesn't work
        d.setHours(0, 0, 0, 0); // paranoia
        return d;
    }

    const keys: Array<string> = [formatDate(today), formatDate(addOneDay(today)), formatDate(addOneDay(addOneDay(today)))];

    for (const key of keys)
    {
        if (!puzzles.hasOwnProperty(key))
            puzzles[key] = (await generateBoard()).serialise();
    }

    await writeWholeFileAsString(puzzlesPath, JSON.stringify(puzzles));

    return 0;
}

generateDailyMain().then((code) => process.exit(code));
