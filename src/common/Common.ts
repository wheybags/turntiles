export type Direction = '^' | 'v' | '<' | '>';
export type MaybeDirection = Direction | 'x';

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
