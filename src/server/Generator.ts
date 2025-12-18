import { SolutionBoard} from "../common/SolutionBoard.ts";
import path from "path";
import fs from "fs";
import {Vec2} from "../common/Vec.ts";
import {assert, BlankDirection, BlankLetter, type Direction, type Letter} from "../common/Common.ts";

function randomIntFromInterval(min: number, max: number): number { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomInt(maxExclusive: number)
{
    if (maxExclusive === 0)
        return 0;
    return randomIntFromInterval(0, maxExclusive-1);
}

export async function generateBoard(): Promise<SolutionBoard>
{
    let board: SolutionBoard | null = null;
    while (true)
    {
        board = await generateBoardInner();
        let blankCount: number = 0;
        for (let y: number= 0; y < board.h; y++)
        {
            for (let x: number = 0; x < board.w; x++)
            {
                if (board.get(x, y).letter == BlankLetter)
                    blankCount++;
            }
        }

        if (blankCount <= 2)
            break;
    }

    return board;
}

function trimEmptyFromStart(val: string): string
{
    if (val.length === 0)
        return val;

    let start: number = 0;
    while (val[start] == BlankLetter)
        start++;

    return val.substring(start);
}

async function generateBoardInner(): Promise<SolutionBoard>
{
    const board = new SolutionBoard(4, 4);

    for (let y = 0; y < board.h; y++)
    {
        for (let x = 0; x < board.w; x++)
        {
            board.set(x, y, {letter: BlankLetter, direction: BlankDirection})
        }
    }

    const allWords: Map<number, Array<string>> = await getWords();
    const seenWords = new Set<string>();


    for (let it = 0; it < 100; it++)
    {
        const emptyEdgeSpaces = new Array<Vec2>();
        for (let y = 0; y < board.h; y++)
        {
            if (board.get(0, y).letter === BlankLetter && board.get(0, y).direction == BlankDirection)
                emptyEdgeSpaces.push(new Vec2(0, y));
            if (board.get(board.w-1, y).letter === BlankLetter && board.get(board.w-1, y).direction === BlankDirection)
                emptyEdgeSpaces.push(new Vec2(board.w - 1, y));
        }
        for (let x = 0; x < board.w; x++)
        {
            if (board.get(x, 0).letter == BlankLetter && board.get(x, 0).direction == BlankDirection)
                emptyEdgeSpaces.push(new Vec2(x, 0));
            if (board.get(x, board.h - 1).letter == BlankLetter && board.get(x, board.h - 1).direction == BlankDirection)
                emptyEdgeSpaces.push(new Vec2(x, board.h - 1));
        }

        if (emptyEdgeSpaces.length == 0)
            break;

        const start: Vec2 = emptyEdgeSpaces[randomInt(emptyEdgeSpaces.length)];
        const placedLen = placeRandomPath(board, start);
        const realLen = placedLen != -1 ? getLen(start, board) : 0;

        //printBoard(board);
        //Console.WriteLine(realLen);

        let success: boolean = false;
        if (realLen >= 4 && realLen < 7)
        {
            const letters: string = getLetters(start, board);
            const end: string = trimEmptyFromStart(letters);
            //Console.WriteLine(end);

            const lengthWords: Array<string> = allWords.get(realLen)!;
            const possibleWords = new Array<string>();
            for (const word of lengthWords)
            {
                if (word.endsWith(end) && !seenWords.has(word))
                    possibleWords.push(word);
            }

            if (possibleWords.length > 0)
            {
                const word: string = possibleWords[randomInt(possibleWords.length)];
                placeWord(word, board, start.x, start.y);
                seenWords.add(word);
                success = true;
            }
        }

        if (!success)
        {
            if (placedLen == -1)
                clearInvalid(start, board);
            else
                clear(start, placedLen, board);
            // console.log(board.printAnsi());
            // console.log("AAAAAAAAAAAAAAAAAAA")
        }

        //Console.WriteLine("------------");
    }


    return board;
}

function getLen(start: Vec2, board: SolutionBoard): number
{
    let current: Vec2 = start;
    let len: number = 0;
    while (current.y >= 0 && current.y < board.h && current.x >= 0 && current.x < board.w)
    {
        len++;
        current = current.plus(dirToVec(board.get(current).direction));
    }
    return len;
}

function getLetters(start: Vec2, board: SolutionBoard): string
{
    let current: Vec2 = start;
    let letters: string = "";
    while (current.y >= 0 && current.y < board.h && current.x >= 0 && current.x < board.w)
    {
        letters += board.get(current).letter;
        current = current.plus(dirToVec(board.get(current).direction));
    }
    return letters;
}

function clearInvalid(start: Vec2, board: SolutionBoard): void
{
    let current: Vec2 = start;
    while (board.get(current).direction != BlankDirection)
    {
        const off: Vec2 = dirToVec(board.get(current).direction);
        board.set(current, {letter: BlankLetter, direction: BlankDirection});
        current = current.plus(off);
    }
}

function clear(start: Vec2, clearLen: number, board: SolutionBoard): void
{
    let current: Vec2 = start;
    for (let i = 0; i < clearLen; i++)
    {
        const off: Vec2 = dirToVec(board.get(current).direction);
        board.set(current, {letter: BlankLetter, direction: BlankDirection});
        current = current.plus(off);
    }
}

function parseLetter(char: string): Letter
{
    assert(char.length === 1);
    assert(char.charCodeAt(0) >= 'a'.charCodeAt(0));
    assert(char.charCodeAt(0) <= 'z'.charCodeAt(0));
    return char as Letter;
}

function placeWord(word: string, board: SolutionBoard, startX: number, startY: number): void
{
    let currentX: number = startX;
    let currentY: number = startY;
    for (let i = 0; i < word.length; i++)
    {
        board.get(currentX, currentY).letter = parseLetter(word[i]);
        switch(board.get(currentX, currentY).direction)
        {
            case '^': currentY--; break;
            case 'v': currentY++; break;
            case '<': currentX--; break;
            case '>': currentX++; break;
        }
    }
}

const dirChars: Direction[] = [ '^', 'v', '<', '>' ];

function dirToVec(dirChar: string): Vec2
{
    switch (dirChar)
    {
        case '^': return new Vec2( 0, -1);
        case 'v': return new Vec2( 0,  1);
        case '<': return new Vec2(-1,  0);
        case '>': return new Vec2( 1,  0);
    }
    throw new Error("unreachable");
}

function placeRandomPath(board: SolutionBoard, start: Vec2): number
{
    const seen = new Set<string>();

    function place(current: Vec2): number
    {
        // console.log(board.printAnsi());
        // console.log("------------------------")
        seen.add(current.x + "," + current.y);

        if (board.get(current).letter != BlankLetter || board.get(current).direction != BlankDirection)
            return 0;

        const possibleDir = new Array<Direction>();
        for (const dirChar of dirChars)
        {
            const directionVec: Vec2 = dirToVec(dirChar);
            const possibleNext = current.plus(directionVec);
            if (seen.has(possibleNext.x + "," + possibleNext.y))
                continue;
            possibleDir.push(dirChar);
        }

        if (possibleDir.length == 0)
            return -1;

        const directionChar: Direction = possibleDir[randomInt(possibleDir.length)];
        const next: Vec2 = current.plus(dirToVec(directionChar));

        board.set(current, {letter: BlankLetter, direction: directionChar});

        if (next.y >= board.h || next.y < 0 || next.x >= board.w || next.x < 0)
            return 1;

        const inner: number = place(next);
        if (inner == -1)
            return -1;
        return inner + 1;
    }

    return place(start);
}


async function getWords(): Promise<Map<number, Array<string>>>
{
    let rootPath= path.dirname(__filename);
    while (!fs.existsSync(rootPath + "/dictionary"))
        rootPath = path.dirname(rootPath);

    const dictLines: Array<string> = (await Bun.file(rootPath + "/dictionary/dictionary_for_generation.txt").text()).split('\n');
    const words = new Map<number, Array<string>>();
    for (const line of dictLines)
    {
        if (!words.has(line.length))
        {
            const wordsLenList: Array<string> = [];
            words.set(line.length, wordsLenList);
        }

        const wordsLenList: Array<string> = words.get(line.length)!;
        wordsLenList.push(line);
    }

    return words;
}
