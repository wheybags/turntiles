import {
    assert,
    BlankDirection,
    type Direction, dirToVec,
    type MaybeDirection,
} from "../common/Common.ts";
import type {SolutionBoard, SolutionBoardSlot} from "../common/SolutionBoard.ts";
import { Vec2 } from "../common/Vec.ts";

export interface Tile
{
    x: number,
    y: number,
    letter: string,
    direction: Direction,
    boardPos: BoardSlot | null,
}

export enum TileStatus
{
    Invalid = 0,
    ValidWord = 1,
    Confirmed = 2,
}

export interface BoardSlot
{
    direction: MaybeDirection,
    tile: Tile | null,
    pointedAtByOtherPos: Array<Vec2>,
    pointAt: Vec2 | null,
    confirmed: TileStatus,
    pos: Vec2,
}

export class GameBoard
{
    public readonly w: number;
    public readonly h: number;
    private readonly data: Array<BoardSlot>;

    public constructor(w: number, h: number) {
        this.w = w;
        this.h = h;
        this.data = [];
        for (let y = 0; y < this.h; y++)
        {
            for (let x = 0; x < this.w; x++)
            {
                this.data.push({
                    direction: BlankDirection,
                    tile: null,
                    pointedAtByOtherPos: [],
                    pointAt: null,
                    confirmed: TileStatus.Invalid,
                    pos: new Vec2(x, y),
                });
            }
        }
    }

    static loadFromSolutionBoard(solutionBoard: SolutionBoard): GameBoard
    {
        const gameBoard = new GameBoard(solutionBoard.w, solutionBoard.h);
        for (let y = 0; y < gameBoard.h; y++)
        {
            for (let x = 0; x < gameBoard.w; x++)
            {
                const solutionSlot: SolutionBoardSlot = solutionBoard.get(x, y);

                let pointAt: Vec2 | null = new Vec2(x, y).plus(dirToVec(solutionSlot.direction));
                if (!(pointAt.x >= 0 && pointAt.x < gameBoard.w && pointAt.y >= 0 && pointAt.y < gameBoard.h))
                    pointAt = null;

                const slot: BoardSlot = gameBoard.get(x, y);
                slot.direction = solutionSlot.direction;
                slot.pointAt = pointAt;
            }
        }

        for (let y: number = 0; y < gameBoard.h; y++)
        {
            for (let x: number = 0; x < gameBoard.w; x++)
            {
                const boardPos: BoardSlot = gameBoard.get(x, y);
                if (boardPos.pointAt !== null)
                    gameBoard.get(boardPos.pointAt).pointedAtByOtherPos.push(new Vec2(x, y));
            }
        }

        return gameBoard;
    }

    public get(x: number, y: number): BoardSlot;
    public get(pos: Vec2): BoardSlot;
    public get(arg1: number | Vec2, arg2?: number): BoardSlot {
        const x: number = arg2 === undefined ? (arg1 as Vec2).x : (arg1 as number);
        const y: number = arg2 === undefined ? (arg1 as Vec2).y : (arg2 as number);

        assert(x >= 0 && x < this.w && y >= 0 && y < this.h);
        return this.data[y * this.w + x];
    }
}
