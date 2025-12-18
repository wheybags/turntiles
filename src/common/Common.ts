import {SolutionBoard} from "./SolutionBoard.ts";

export type Direction = '^' | 'v' | '<' | '>';
export type MaybeDirection = Direction | 'x';
export const BlankDirection: MaybeDirection = 'x'

export function parseDirection(char: string): Direction
{
    assert(char === '^' || char === 'v' || char === '<' || char === '>');
    return char as Direction;
}

export function parseMaybeDirection(char: string): MaybeDirection
{
    if (char === BlankDirection)
        return char
    return parseDirection(char);
}

export type Letter = 'a'|'b'|'c'|'d'|'e'|'f'|'g'|'h'|'i'|'j'|'k'|'l'|'m'|'n'|'o'|'p'|'q'|'r'|'s'|'t'|'u'|'v'|'w'|'x'|'y'|'z';
export type MaybeLetter = Letter | '-';
export const BlankLetter: MaybeLetter = '-';

export function parseLetter(char: string): Letter
{
    assert(char.length === 1);
    assert(char.charCodeAt(0) >= 'a'.charCodeAt(0));
    assert(char.charCodeAt(0) <= 'z'.charCodeAt(0));
    return char as Letter;
}

export function parseMaybeLetter(char: string): MaybeLetter
{
    if (char == BlankLetter)
        return char;
    return parseLetter(char);
}

export function assert(val: any): void
{
    if (!val)
        throw new Error("assert failed");
}

export function formatDate(date: Date): string
{
    return date.getFullYear().toString() + "-" + (date.getMonth()+1).toString() + "-" + date.getDate();
}

// https://stackoverflow.com/a/12646864
export function shuffleArray(array: any[])
{
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}
