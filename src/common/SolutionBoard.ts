import {
    assert,
    BlankDirection,
    BlankLetter,
    type MaybeDirection,
    type MaybeLetter, parseMaybeDirection,
    parseMaybeLetter
} from "./Common.ts";
import type {Vec2} from "./Vec.ts";

export interface SolutionBoardSlot
{
    letter: MaybeLetter;
    direction: MaybeDirection
}

export class SolutionBoard
{
    public readonly w: number;
    public readonly h: number;
    private readonly data: Array<SolutionBoardSlot>;

    public constructor(w: number, h: number)
    {
        this.w = w;
        this.h = h;
        this.data = [];
        for (let i = 0; i < w*h; i++)
            this.data.push({letter: BlankLetter, direction: BlankDirection});
    }

    public get(x: number, y: number): SolutionBoardSlot;
    public get(pos: Vec2): SolutionBoardSlot;
    public get(arg1: number | Vec2, arg2?: number): SolutionBoardSlot
    {
        const x: number = arg2 === undefined ? (arg1 as Vec2).x : (arg1 as number);
        const y: number = arg2 === undefined ? (arg1 as Vec2).y : (arg2 as number);

        assert(x >= 0 && x < this.w && y >= 0 && y < this.h);
        return this.data[y*this.w + x];
    }

    public set(x: number, y: number, val: SolutionBoardSlot): void;
    public set(pos: Vec2, val: SolutionBoardSlot): void;
    public set(arg1: any, arg2: any, arg3?: any): void
    {
        const x: number = arg3 === undefined ? (arg1 as Vec2).x : (arg1 as number);
        const y: number = arg3 === undefined ? (arg1 as Vec2).y : (arg2 as number);
        const val: SolutionBoardSlot = arg3 === undefined ? (arg2 as SolutionBoardSlot) : (arg3 as SolutionBoardSlot);

        assert(x >= 0 && x < this.w && y >= 0 && y < this.h);
        this.data[y*this.w + x] = val;
    }

    public serialise(): string
    {
        const sb = new Array<string>();

        sb.push(""+this.w);
        sb.push('x');
        sb.push(""+this.h);
        sb.push(' ');

        for (let y: number = 0; y < this.h; y++)
        {
            for (let x: number = 0; x < this.w; x++)
            {
                const slot: SolutionBoardSlot = this.get(x, y);
                sb.push(slot.letter);
                sb.push(slot.direction);
            }

            if (y != this.h-1)
                sb.push(' ');
        }

        return sb.join("");
    }

    static deserialise(gameString: string): SolutionBoard
    {
        gameString = gameString.replace(/ /g,'');

        let i = 0;
        let acc = "";

        let boardTilesW = 0;
        for (; i < gameString.length; i++)
        {
            if (gameString[i] === 'x')
            {
                boardTilesW = parseInt(acc);
                acc = "";
                break;
            }
            else
            {
                assert(!!gameString[i].match(/[0-9]/i));
                acc += gameString[i];
            }
        }

        assert(gameString[i] === 'x');
        i++;

        let boardTilesH = 0;
        for (; i < gameString.length; i++)
        {
            if (!gameString[i].match(/[0-9]/i))
            {
                boardTilesH = parseInt(acc);
                acc = "";
                break;
            }
            else
            {
                acc += gameString[i];
            }
        }

        const solutionBoard = new SolutionBoard(boardTilesW, boardTilesH);
        for (let y = 0; y < boardTilesH; y++)
        {
            for (let x = 0; x < boardTilesW; x++)
            {
                const letter: MaybeLetter = parseMaybeLetter(gameString[i]);
                const direction: MaybeDirection = parseMaybeDirection(gameString[i + 1]);
                solutionBoard.set(x, y, {letter, direction});
                i += 2;
            }
        }

        return solutionBoard;
    }

    public printAnsi()
    {
        const sb: Array<string> = [];

        function printCellLine( cell: SolutionBoardSlot, line: number)
        {
            switch (line)
            {
                case 0:
                {
                    if (cell.letter === BlankLetter && cell.direction === BlankDirection)
                        sb.push("   ");
                    else if (cell.direction === '^')
                        sb.push("┌┴┐");
                    else
                        sb.push("┌─┐");
                    break;
                }
                case 1:
                {
                    if (cell.letter === BlankLetter && cell.direction === BlankDirection)
                        sb.push(" x ");
                    else if (cell.direction === '<')
                        sb.push("┤" + cell.letter + "│");
                    else if (cell.direction == '>')
                        sb.push("│" + cell.letter + "├");
                    else
                       sb.push("│" + cell.letter + "│");
                    break;
                }
                case 2:
                {
                    if (cell.letter == BlankLetter && cell.direction === BlankDirection)
                        sb.push("   ");
                    else if (cell.direction == 'v')
                        sb.push("└┬┘");
                    else
                        sb.push("└─┘");
                    break;
                }
            }
        }


        for (let y = 0; y < this.h; y++)
        {
            for (let line = 0; line < 3; line++)
            {
                for (let x = 0; x < this.w; x++)
                {
                    printCellLine(this.get(x, y), line);
                }
                sb.push('\n');
            }
        }

        return sb.join('');
    }
}