import {generateBoard} from "./Generator.ts";
import type {SolutionBoard} from "../common/SolutionBoard.ts";

async function generateTestMain() : Promise<number>
{
    const board: SolutionBoard = await generateBoard();
    console.log(board.printAnsi());
    console.log(board.serialise());
    return 0;
}

generateTestMain().then((code) => process.exit(code));
