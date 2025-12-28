import {TileStatus} from "./GameBoard.ts";
import {Game, GameState} from "./Game.ts";
import { assert } from "../common/Common.ts";

const BOARD_COLOR = "#aaaaa3";
const BOARD_SLOT_COLOR = "#efefe6";
const BOARD_CONNECT_COLOR = "#60605c";
const BOARD_CONFIRMED_COLOR = "#346c17";
const BOARD_VALIDWORD_WIN_COLOR = "#b69712"
const TILE_COLOR = "#5a594e";
const TILE_CONFIRMED_COLOR = BOARD_CONFIRMED_COLOR;
const TILE_BORDER_COLOR = "black";//"#3d3d35";

export function renderTiles(game: Game): void
{
    for (const tile of game.tiles)
    {
        let color = TILE_COLOR;
        if (tile.boardPos && tile.boardPos.confirmed === TileStatus.Confirmed)
            color = TILE_CONFIRMED_COLOR;
        else if (game.gameState === GameState.WonOriginal && tile.boardPos!.confirmed === TileStatus.ValidWord)
            color = BOARD_VALIDWORD_WIN_COLOR;

        game.ctx.beginPath();
        game.ctx.roundRect(tile.x-game.TILE_SIZE/2, tile.y-game.TILE_SIZE/2, game.TILE_SIZE, game.TILE_SIZE, [game.TILE_RADIUS]);
        game.ctx.fillStyle = color;
        game.ctx.fill();
        game.ctx.strokeStyle = TILE_BORDER_COLOR
        game.ctx.lineWidth = game.TILE_BORDER;
        game.ctx.stroke();

        const rotateDegrees = {">": 0, "v": 90, "<": 180, "^": 270}[tile.direction]

        game.ctx.translate(tile.x, tile.y);
        game.ctx.rotate(rotateDegrees * Math.PI / 180);
        game.ctx.beginPath();
        game.ctx.moveTo(game.TILE_SIZE/2, -game.ARROW_WIDE);
        game.ctx.lineTo(game.TILE_SIZE/2, +game.ARROW_WIDE);
        game.ctx.lineTo(game.TILE_SIZE/2+game.ARROW_LONG, 0);
        game.ctx.fillStyle = TILE_BORDER_COLOR;
        game.ctx.fill();
        game.ctx.beginPath();
        game.ctx.moveTo(game.TILE_SIZE/2-game.ARROW_LONG*0.65, -game.ARROW_WIDE);
        game.ctx.lineTo(game.TILE_SIZE/2-game.ARROW_LONG*0.65, +game.ARROW_WIDE);
        game.ctx.lineTo(game.TILE_SIZE/2-game.ARROW_LONG*0.65+game.ARROW_LONG, 0);
        game.ctx.fillStyle = color;
        game.ctx.fill();
        game.ctx.resetTransform();

        game.ctx.font = "bold " + game.TILE_TEXT_SIZE + "px 'Libre Franklin', sans-serif";
        game.ctx.fillStyle = "white";
        const text = game.ctx.measureText(tile.letter.toUpperCase());

        const xOff = text.actualBoundingBoxLeft - (text.actualBoundingBoxLeft + text.actualBoundingBoxRight) / 2;
        const yOff = text.actualBoundingBoxAscent - (text.actualBoundingBoxAscent + text.actualBoundingBoxDescent) / 2;
        game.ctx.fillText(tile.letter.toUpperCase(), tile.x + xOff, tile.y + yOff);
    }
}

export function renderBoard(game: Game): void
{
    game.ctx.beginPath();
    game.ctx.roundRect(game.boardX, game.boardY,
        game.boardW, game.boardH,
        [game.TILE_RADIUS]);

    game.ctx.fillStyle = BOARD_COLOR;
    game.ctx.fill();

    for (let y = 0; y < game.board.h; y++)
    {
        for (let x = 0; x < game.board.w; x++)
        {
            const direction = game.board.get(x, y).direction;

            if (direction === "x")
                continue;

            const slotX = game.boardX + game.BOARD_PAD + x*(game.TILE_SIZE+game.BOARD_PAD) + game.TILE_SIZE/2;
            const slotY = game.boardY + game.BOARD_PAD + y*(game.TILE_SIZE+game.BOARD_PAD) + game.TILE_SIZE/2;

            let connectColour = BOARD_CONNECT_COLOR;
            if (game.board.get(x, y).confirmed === TileStatus.Confirmed)
                connectColour = BOARD_CONFIRMED_COLOR
            else if (game.gameState === GameState.WonOriginal && game.board.get(x, y).confirmed === TileStatus.ValidWord)
                connectColour = BOARD_VALIDWORD_WIN_COLOR;

            const rotateDegrees = {">": 0, "v": 90, "<": 180, "^": 270}[direction]

            const connectionWide = game.ARROW_WIDE *2;

            game.ctx.translate(slotX, slotY);
            game.ctx.rotate(rotateDegrees * Math.PI / 180);
            {
                if (game.board.get(x, y).pointedAtByOtherPos.length === 0)
                {
                    game.ctx.beginPath();
                    game.ctx.arc(-game.TILE_SIZE / 2 - 1, 0, connectionWide/2, 0, 2 * Math.PI);
                    game.ctx.fillStyle = connectColour;
                    game.ctx.fill();
                }

                if (game.board.get(x, y).pointAt)
                {
                    game.ctx.beginPath();
                    game.ctx.fillStyle = connectColour;
                    game.ctx.fillRect(game.TILE_SIZE / 2, -(connectionWide / 2), game.BOARD_PAD, connectionWide);
                }
            }
            game.ctx.resetTransform();

            game.ctx.beginPath();
            game.ctx.roundRect(slotX-game.TILE_SIZE/2, slotY-game.TILE_SIZE/2, game.TILE_SIZE, game.TILE_SIZE, [game.TILE_RADIUS]);
            game.ctx.fillStyle = BOARD_SLOT_COLOR;
            game.ctx.fill();

            game.ctx.translate(slotX, slotY);
            game.ctx.rotate(rotateDegrees * Math.PI / 180);
            {
                game.ctx.beginPath();
                game.ctx.moveTo(game.TILE_SIZE / 2 - 1, -game.ARROW_WIDE);
                game.ctx.lineTo(game.TILE_SIZE / 2 - 1, +game.ARROW_WIDE);
                game.ctx.lineTo(game.TILE_SIZE / 2 + game.ARROW_LONG - 1, 0);
                game.ctx.fillStyle = BOARD_SLOT_COLOR;
                game.ctx.fill();
            }
            game.ctx.resetTransform();
        }
    }
}

let messageDiv: HTMLElement | null = null;
let messageDivLastString: string | null = null;

function createElement(html: string): HTMLElement
{
    const parent = document.createElement("div");
    parent.innerHTML = html;
    assert(parent.children.length === 1);
    return parent.children.item(0)! as HTMLElement;
}

function formatMinutesSeconds(ms: number, nbsp: boolean): string
{
    const space = nbsp ? "&nbsp;" : " ";

    let secondsRemaining = Math.floor(ms / 1000);

    let result = "";

    if (secondsRemaining > 60*60)
    {
        const hours = Math.floor(secondsRemaining / (60*60));
        secondsRemaining -= hours * (60*60);
        result += hours + "H";
    }

    if (secondsRemaining > 60)
    {
        const minutes = Math.floor(secondsRemaining / 60);
        secondsRemaining -= minutes * 60;
        if (result.length)
            result += space;
        result += minutes + "M";
    }

    if (secondsRemaining > 0 || result.length === 0)
    {
        if (result.length)
            result += space;
        result += secondsRemaining + "S";
    }

    return result;
}

declare global {
    interface Window {
        onShareClicked: (shareLink: HTMLElement) => void;
    }
}

async function onShareClicked(shareLink: HTMLElement): Promise<void>
{
    const time = formatMinutesSeconds(window.game!.getTimeSpentMs(), false);
    const url = window.location.origin + window.location.pathname + "?day=" + window.game!.gameId;
    const message = `I finished Turntile in ${time}! ${url}`;
    await navigator.clipboard.writeText(message);

    const toast = createElement(`
        <div
            style="
                position: absolute;
                left: ${shareLink.getBoundingClientRect().left}px;
                top: ${shareLink.getBoundingClientRect().top}px;
                z-index: 20;
                background: white;
                padding: 3px;
                border-radius: 5px;
                color: black;
                text-align: center;"
        >
            COPIED TO<br>CLIPBOARD
        </div>
    `);

    toast.className = "fadeOut";

    toast.addEventListener('animationend', () => {
        toast.remove();
    });

    toast.addEventListener('animationcancel', () => {
        toast.remove();
    });

    document.body.appendChild(toast);
}
window.onShareClicked = onShareClicked;

export function renderVictoryMessage(game: Game): void
{
    if (game.gameState === GameState.NotWon)
    {
        messageDiv?.parentNode?.removeChild(messageDiv);
        messageDiv = null;
        messageDivLastString = null;
        return;
    }

    const areaTop: number = (game.boardY + game.boardH + game.TILE_SIZE) / window.devicePixelRatio;

    let altMessage: string | null = null;
    let backgroundColor = BOARD_CONFIRMED_COLOR;
    if (game.gameState === GameState.WonOriginal)
    {
        altMessage = "<br>ALTERNATIVE SOLUTION";
        backgroundColor = BOARD_VALIDWORD_WIN_COLOR;
    }

    let share = "";
    if (game.gameId != 'url')
        share = `&nbsp;-&nbsp;<a href="#" style="color: white" onclick="onShareClicked(this)">SHARE</a>`;

    let messageDivString = `
    <div style="position: absolute; 
                left: 0; 
                background-color: ${backgroundColor};
                width: 100%; 
                z-index: 10;
                align-items: center;
                justify-content: center;
                color: white;
                display: flex;
                top: ${areaTop}px;"
    >
        <span style="text-align: center; margin: 30px">
            <span style="font: bold ${game.TILE_TEXT_SIZE/window.devicePixelRatio}px 'Libre Franklin', sans-serif;">
                YOU WIN!
            </span>
            <span style="font: bold ${(game.TILE_TEXT_SIZE/window.devicePixelRatio)/2}px 'Libre Franklin', sans-serif;"">
                ${altMessage || ""}
                <br>TIME&nbsp;${formatMinutesSeconds(game.getTimeSpentMs(), true)}${share}
            </span>
        </span>
    </div>`;

    if (messageDivString !== messageDivLastString)
    {
        messageDiv?.parentNode?.removeChild(messageDiv);
        messageDiv = createElement(messageDivString);
        messageDivLastString = messageDivString;
        document.body.appendChild(messageDiv);
    }
}

