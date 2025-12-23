import {TileStatus} from "./GameBoard.ts";
import {Game, GameState} from "./Game.ts";

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
let messageDivInnerHTML: string | null = null;
let messageDivTop: string | null = null;
let messageDivBackgroundColor: string | null = null;
let messageDivFont: string | null = null;

export function renderVictoryMessage(game: Game)
{
    if (game.gameState === GameState.NotWon)
    {
        if (messageDiv)
        {
            messageDiv.parentNode?.removeChild(messageDiv);
            messageDiv = null;
            messageDivInnerHTML = null;
            messageDivTop = null;
            messageDivBackgroundColor = null;
            messageDivFont = null;
        }
        return
    }

    if (!messageDiv)
    {
        messageDiv = document.createElement("div");
        messageDiv.id = "victory_message";
        messageDiv.style.position = "absolute";
        messageDiv.style.left = "0";
        messageDiv.style.width = "100%";
        messageDiv.style.zIndex = "10";
        messageDiv.style.alignItems = "center";
        messageDiv.style.justifyContent = "center";
        messageDiv.style.color = "white";
        messageDiv.style.display = "flex";
        document.body.appendChild(messageDiv);
    }

    const areaTop = (game.boardY + game.boardH + game.TILE_SIZE) / window.devicePixelRatio;

    let message =  `<span style="text-align: center; margin: 30px">YOU WIN!`;

    let backgroundColor = BOARD_CONFIRMED_COLOR;
    if (game.gameState === GameState.WonOriginal)
    {
        message += "<br>ALTERNATIVE SOLUTION";
        backgroundColor = BOARD_VALIDWORD_WIN_COLOR;
    }

    // message += "<br>TIME 5M 23S";

    message += `</span>`;

    const top = areaTop + 'px';
    const font = "bold " + (game.TILE_TEXT_SIZE/window.devicePixelRatio) + "px 'Libre Franklin', sans-serif";

    if (messageDivInnerHTML !== message)
    {
        messageDivInnerHTML = message;
        messageDiv.innerHTML = message;
    }

    if (messageDivTop !== top)
    {
        messageDivTop = top;
        messageDiv.style.top = top;
    }

    if (messageDivBackgroundColor !== backgroundColor)
    {
        messageDivBackgroundColor = backgroundColor;
        messageDiv.style.backgroundColor = backgroundColor;
    }

    if (messageDivFont !== font)
    {
        messageDivFont = font;
        messageDiv.style.font = font;
    }
}

