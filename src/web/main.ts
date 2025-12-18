import {
    assert, BlankLetter,
    type Direction,
    formatDate,
    type MaybeDirection,
    type MaybeLetter, parseDirection, parseMaybeDirection, parseMaybeLetter,
    shuffleArray
} from "../common/Common.ts";
import {SolutionBoard, type SolutionBoardSlot} from "../common/SolutionBoard.ts";
import {Vec2} from "../common/Vec.ts";

interface Tile
{
    x: number,
    y: number,
    letter: string,
    direction: Direction,
    boardPos: BoardSlot | null,
}

interface BoardSlot
{
    direction: MaybeDirection,
    tile: Tile | null,
    pointedAtByOtherPos: Array<Vec2>,
    pointAt: Vec2 | null,
    confirmed: number,
    pos: Vec2,
}

type Board = BoardSlot[][];

const ENUM_TILESTATUS_INVALID   = 0
const ENUM_TILESTATUS_VALIDWORD = 1;
const ENUM_TILESTATUS_CONFIRMED = 2;



(async () => {

    function parseGameString(gameString: string): [Board, Tile[], SolutionBoard]
    {
        gameString = gameString.replace(/ /g,'');

        const board: Board = [];
        const tiles: Tile[] = [];

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

        for (let y = 0; y < boardTilesH; y++)
        {
            const row: BoardSlot[] = [];
            board.push(row);
            for (let x = 0; x < boardTilesW; x++)
            {
                const letter: MaybeLetter = solutionBoard.get(x, y).letter;
                const direction: MaybeDirection = solutionBoard.get(x, y).direction;

                if (letter !== BlankLetter)
                {
                    tiles.push({
                        x: 0,
                        y: 0,
                        letter: letter,
                        direction: parseDirection(direction),
                        boardPos: null,
                    })
                }

                let pointAtX = x;
                let pointAtY = y;
                if (direction === "<")
                    pointAtX--;
                else if (direction === ">")
                    pointAtX++;
                else if (direction === "^")
                    pointAtY--;
                else if (direction === "v")
                    pointAtY++;

                let pointAt: Vec2 | null = new Vec2(pointAtX, pointAtY);
                if (!(pointAtX >= 0 && pointAtX < boardTilesW && pointAtY >= 0 && pointAtY < boardTilesH))
                    pointAt = null;

                row.push({
                    direction: direction,
                    tile: null,
                    pointedAtByOtherPos: [],
                    pointAt: pointAt,
                    confirmed: ENUM_TILESTATUS_INVALID,
                    pos: new Vec2(x, y),
                })
            }
        }

        for (let y = 0; y < boardTilesH; y++)
        {
            for (let x = 0; x < boardTilesW; x++)
            {
                const boardPos = board[y][x];
                if (boardPos.pointAt !== null)
                    board[boardPos.pointAt.y][boardPos.pointAt.x].pointedAtByOtherPos.push(new Vec2(x, y));
            }
        }

        shuffleArray(tiles);

        return [board, tiles, solutionBoard];
    }

    function randomScatterTiles(tileSpawnTop: number, tileSpawnBottom: number, tileSpawnLeft: number, tileSpawnRight: number): void
    {
        for (const tile of tiles)
        {
            tile.x = tileSpawnLeft + (tileSpawnRight-tileSpawnLeft)/2 + Math.random();
            tile.y = tileSpawnTop + (tileSpawnBottom-tileSpawnTop)/2 + Math.random();
        }

        // a few iterations of reverse flocking to push tiles apart
        for (let i = 0; i < 500; i++)
        {
            for (const tile of tiles)
            {
                let dir = [Math.random()*2-1,Math.random()*2-1];

                for (const other of tiles)
                {
                    if (other === tile)
                        continue;

                    const v = [tile.x - other.x, tile.y - other.y];

                    if (Math.abs(v[0]) > 0.000001 || Math.abs(v[1]) > 0.000001)
                    {
                        let mag = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
                        v[0] = v[0]/mag; v[1] = v[1]/mag; // v = normalize(v);

                        let alpha = smoothstep(0, TILE_SIZE*2, mag);
                        alpha = 1.0 - alpha;

                        dir[0] += v[0] * alpha;
                        dir[1] += v[1] * alpha;
                    }
                }

                tile.x += dir[0];
                tile.y += dir[1];

                if (tile.x < tileSpawnLeft)
                    tile.x = tileSpawnLeft;
                if (tile.x > tileSpawnRight)
                    tile.x = tileSpawnRight;
                if (tile.y < tileSpawnTop)
                    tile.y = tileSpawnTop;
                if (tile.y > tileSpawnBottom)
                    tile.y = tileSpawnBottom;
            }
        }
    }

    function smoothstep(edge0: number, edge1: number, x: number): number {
        const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
        return t * t * (3 - 2 * t);
    }

    async function loadDictionary(): Promise<Set<string>>
    {
        const response = await fetch("dictionary_full.txt");
        assert(response.ok);
        const text = await response.text();
        return new Set<string>(text.split('\n'));
    }

    const dateKey = formatDate(new Date());

    async function loadPuzzles(): Promise<Record<string, string>>
    {
        const response = await fetch("puzzles.json?blah=" + dateKey); // force cache break daily
        assert(response.ok);
        return await response.json();
    }

    const dictionary = await loadDictionary();
    const puzzles = await loadPuzzles();


    let gameString: string = puzzles[dateKey];

    // let gameString = "4x4 rvb>rvd< evt>avc< nve^k>e> tvb^i^h<";
    // let gameString = "4x4 y<rvd<-x l^y<h<s< l^o<o>uv a^f^s^p>";
    //const gameString = "4x4 rvbvev-x uvivd<hv lvb<b<o< eva^c<g^";
    // 4x4 c>o>o>l> t>o>o>l> e<r<i<f< e<r<i<t<

    const urlParams = new URLSearchParams(window.location.search);
    const gameStringFromUrl = urlParams.get('board');
    if (gameStringFromUrl)
        gameString = gameStringFromUrl;

    const gameCanvas = document.getElementById("game_canvas") as HTMLCanvasElement;
    const ctx = gameCanvas.getContext("2d") as CanvasRenderingContext2D;

    let scale = window.devicePixelRatio;

    let TILE_SIZE = 0;
    let TILE_RADIUS = 0;
    let TILE_BORDER = 0;
    let ARROW_WIDE = 0;
    let ARROW_LONG = 0;
    let TILE_TEXT_SIZE = 0;
    let BOARD_PAD = 0;
    let TILE_SPAWN_PAD = 0;

    let boardW = 0;
    let boardH = 0;
    let boardX = 0;
    let boardY = 0;

    const BOARD_COLOR = "#aaaaa3";
    const BOARD_SLOT_COLOR = "#efefe6";
    const BOARD_CONNECT_COLOR = "#60605c";
    const BOARD_CONFIRMED_COLOR = "#346c17";
    const BOARD_VALIDWORD_WIN_COLOR = "#b69712"
    const TILE_COLOR = "#5a594e";
    const TILE_CONFIRMED_COLOR = BOARD_CONFIRMED_COLOR;
    const TILE_BORDER_COLOR = "black";//"#3d3d35";

    const [board, tiles, solutionBoard] = parseGameString(gameString);
    const boardTilesW = board[0].length;
    const boardTilesH = board.length;

    const ENUM_GAMESTATE_NOTWON = 0;
    const ENUM_GAMESTATE_WON_CONFIRMED = 1;
    const ENUM_GAMESTATE_WON_ORIGINAL = 2;
    let gameState = ENUM_GAMESTATE_NOTWON;

    function rescale(): void
    {
        gameCanvas.width = gameCanvas.clientWidth * window.devicePixelRatio;
        gameCanvas.height = gameCanvas.clientHeight * window.devicePixelRatio;

        TILE_SIZE = 50;
        TILE_RADIUS = 8;
        TILE_BORDER = 5;
        ARROW_WIDE = 10;
        ARROW_LONG = 10;
        TILE_TEXT_SIZE = 30;
        BOARD_PAD = 15;
        TILE_SPAWN_PAD = TILE_SIZE/2 + BOARD_PAD;

        let mobile = gameCanvas.clientHeight > gameCanvas.clientWidth*1.5;

        if (mobile)
        {
            const boardTargetW = gameCanvas.clientWidth * window.devicePixelRatio * 0.8;
            scale = boardTargetW / (boardTilesW * TILE_SIZE + (boardTilesW + 1) * BOARD_PAD);
        }
        else
        {
            scale = window.devicePixelRatio;
        }

        TILE_SIZE *= scale;
        TILE_RADIUS *= scale;
        TILE_BORDER *= scale;
        ARROW_WIDE *= scale;
        ARROW_LONG *= scale;
        TILE_TEXT_SIZE *= scale;
        BOARD_PAD *= scale;

        boardW = boardTilesW*TILE_SIZE + (boardTilesW+1)*BOARD_PAD;
        boardH = boardTilesH*TILE_SIZE + (boardTilesH+1)*BOARD_PAD;

        let oldBoardX = boardX;
        let oldBoardY = boardY;

        boardX = Math.round(gameCanvas.width / 2 - boardW / 2);
        boardY = 30 * scale;

        for (const tile of tiles)
        {
            let relativeX = tile.x - oldBoardX;
            let relativeY = tile.y - oldBoardY;

            tile.x = boardX + relativeX;
            tile.y = boardY + relativeY;
        }

        for (const tile of tiles)
        {
            if (tile.boardPos)
            {
                const slotX = boardX + BOARD_PAD + tile.boardPos.pos.x * (TILE_SIZE + BOARD_PAD) + TILE_SIZE / 2;
                const slotY = boardY + BOARD_PAD + tile.boardPos.pos.y * (TILE_SIZE + BOARD_PAD) + TILE_SIZE / 2;

                tile.x = slotX;
                tile.y = slotY;
            }
            else
            {
                const left = TILE_SIZE/2;
                const right = gameCanvas.clientWidth*window.devicePixelRatio - TILE_SIZE/2;
                const top = TILE_SIZE/2;
                const bottom = gameCanvas.clientHeight*window.devicePixelRatio - TILE_SIZE/2;

                if (tile.x < left)
                    tile.x = left;
                if (tile.x > right)
                    tile.x = right;
                if (tile.y < top)
                    tile.y = top;
                if (tile.y > bottom)
                    tile.y = bottom;
            }
        }
    }

    rescale();

    {
        let tileSpawnTop = boardY + boardH;
        let tileSpawnBottom = Math.min(tileSpawnTop + boardH, gameCanvas.height);

        if (tileSpawnBottom < gameCanvas.height - TILE_SPAWN_PAD)
        {
            tileSpawnTop += TILE_SPAWN_PAD;
            tileSpawnBottom += TILE_SPAWN_PAD;
        }
        let tileSpawnLeft = Math.max(0, boardX - TILE_SIZE * 2);
        let tileSpawnRight = Math.min(gameCanvas.width, boardX + boardW + TILE_SIZE * 2);

        const off = TILE_SIZE;
        tileSpawnTop += off;
        tileSpawnBottom -= off;
        tileSpawnLeft += off;
        tileSpawnRight -= off;

        randomScatterTiles(tileSpawnTop, tileSpawnBottom, tileSpawnLeft, tileSpawnRight);
    }

    let selectedTile: Tile | null = null;
    let snappedBoardPos: BoardSlot | null = null;
    let selectOffsetX: number | null = null;
    let selectOffsetY: number | null = null;

    function renderTiles(): void
    {
        for (const tile of tiles)
        {
            let color = TILE_COLOR;
            if (tile.boardPos && tile.boardPos.confirmed === ENUM_TILESTATUS_CONFIRMED)
                color = TILE_CONFIRMED_COLOR;
            else if (gameState === ENUM_GAMESTATE_WON_ORIGINAL && tile.boardPos!.confirmed === ENUM_TILESTATUS_VALIDWORD)
                color = BOARD_VALIDWORD_WIN_COLOR;

            ctx.beginPath();
            ctx.roundRect(tile.x-TILE_SIZE/2, tile.y-TILE_SIZE/2, TILE_SIZE, TILE_SIZE, [TILE_RADIUS]);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = TILE_BORDER_COLOR
            ctx.lineWidth = TILE_BORDER;
            ctx.stroke();

            const rotateDegrees = {">": 0, "v": 90, "<": 180, "^": 270}[tile.direction]

            ctx.translate(tile.x, tile.y);
            ctx.rotate(rotateDegrees * Math.PI / 180);
            ctx.beginPath();
            ctx.moveTo(TILE_SIZE/2, -ARROW_WIDE);
            ctx.lineTo(TILE_SIZE/2, +ARROW_WIDE);
            ctx.lineTo(TILE_SIZE/2+ARROW_LONG, 0);
            ctx.fillStyle = TILE_BORDER_COLOR;
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(TILE_SIZE/2-ARROW_LONG*0.65, -ARROW_WIDE);
            ctx.lineTo(TILE_SIZE/2-ARROW_LONG*0.65, +ARROW_WIDE);
            ctx.lineTo(TILE_SIZE/2-ARROW_LONG*0.65+ARROW_LONG, 0);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.resetTransform();

            ctx.font = "bold " + TILE_TEXT_SIZE + "px 'Libre Franklin', sans-serif";
            ctx.fillStyle = "white";
            const text = ctx.measureText(tile.letter.toUpperCase());

            const xOff = text.actualBoundingBoxLeft - (text.actualBoundingBoxLeft + text.actualBoundingBoxRight) / 2;
            const yOff = text.actualBoundingBoxAscent - (text.actualBoundingBoxAscent + text.actualBoundingBoxDescent) / 2;
            ctx.fillText(tile.letter.toUpperCase(), tile.x + xOff, tile.y + yOff);
        }
    }

    function renderBoard(): void
    {
        ctx.beginPath();
        ctx.roundRect(boardX, boardY,
            boardW, boardH,
            [TILE_RADIUS]);

        ctx.fillStyle = BOARD_COLOR;
        ctx.fill();

        for (let y = 0; y < boardTilesH; y++)
        {
            for (let x = 0; x < boardTilesW; x++)
            {
                const direction = board[y][x].direction;

                if (direction === "x")
                    continue;

                const slotX = boardX + BOARD_PAD + x*(TILE_SIZE+BOARD_PAD) + TILE_SIZE/2;
                const slotY = boardY + BOARD_PAD + y*(TILE_SIZE+BOARD_PAD) + TILE_SIZE/2;

                let connectColour = BOARD_CONNECT_COLOR;
                if (board[y][x].confirmed === ENUM_TILESTATUS_CONFIRMED)
                    connectColour = BOARD_CONFIRMED_COLOR
                else if (gameState === ENUM_GAMESTATE_WON_ORIGINAL && board[y][x].confirmed === ENUM_TILESTATUS_VALIDWORD)
                    connectColour = BOARD_VALIDWORD_WIN_COLOR;

                const rotateDegrees = {">": 0, "v": 90, "<": 180, "^": 270}[direction]

                const connectionWide = ARROW_WIDE *2;

                ctx.translate(slotX, slotY);
                ctx.rotate(rotateDegrees * Math.PI / 180);
                {
                    if (board[y][x].pointedAtByOtherPos.length === 0)
                    {
                        ctx.beginPath();
                        ctx.arc(-TILE_SIZE / 2 - 1, 0, connectionWide/2, 0, 2 * Math.PI);
                        ctx.fillStyle = connectColour;
                        ctx.fill();
                    }

                    if (board[y][x].pointAt)
                    {
                        ctx.beginPath();
                        ctx.fillStyle = connectColour;
                        ctx.fillRect(TILE_SIZE / 2, -(connectionWide / 2), BOARD_PAD, connectionWide);
                    }
                }
                ctx.resetTransform();

                ctx.beginPath();
                ctx.roundRect(slotX-TILE_SIZE/2, slotY-TILE_SIZE/2, TILE_SIZE, TILE_SIZE, [TILE_RADIUS]);
                ctx.fillStyle = BOARD_SLOT_COLOR;
                ctx.fill();

                ctx.translate(slotX, slotY);
                ctx.rotate(rotateDegrees * Math.PI / 180);
                {
                    ctx.beginPath();
                    ctx.moveTo(TILE_SIZE / 2 - 1, -ARROW_WIDE);
                    ctx.lineTo(TILE_SIZE / 2 - 1, +ARROW_WIDE);
                    ctx.lineTo(TILE_SIZE / 2 + ARROW_LONG - 1, 0);
                    ctx.fillStyle = BOARD_SLOT_COLOR;
                    ctx.fill();
                }
                ctx.resetTransform();
            }
        }
    }

    function confirmTiles()
    {
        for (let y = 0; y < boardTilesH; y++)
        {
            for (let x = 0; x < boardTilesW; x++)
            {
                const boardPos = board[y][x];
                boardPos.confirmed = ENUM_TILESTATUS_INVALID;
            }
        }

        for (let y = 0; y < boardTilesH; y++)
        {
            for (let x = 0; x < boardTilesW; x++)
            {
                const boardPos = board[y][x];

                if (boardPos.pointedAtByOtherPos.length !== 0)
                    continue;

                let confirmed = true;
                let word = "";

                {
                    function check(posToCheck: BoardSlot)
                    {
                        const solutionItem: SolutionBoardSlot = solutionBoard.get(posToCheck.pos);

                        if (posToCheck.tile)
                            word += posToCheck.tile.letter;
                        else
                            word += "-";

                        if (!posToCheck.tile || posToCheck.tile.letter !== solutionItem.letter || posToCheck.tile.direction !== solutionItem.direction)
                            confirmed = false;
                    }

                    let current = boardPos;
                    check(current);
                    while (current.pointAt)
                    {
                        current = board[current.pointAt.y][current.pointAt.x];
                        check(current);
                    }
                }

                const valid = dictionary.has(word);

                if (confirmed || valid)
                {
                    const value = confirmed ? ENUM_TILESTATUS_CONFIRMED : ENUM_TILESTATUS_VALIDWORD;

                    let current = boardPos;
                    current.confirmed = Math.max(current.confirmed, value);
                    while (current.pointAt)
                    {
                        current = board[current.pointAt.y][current.pointAt.x];
                        current.confirmed = Math.max(current.confirmed, value);
                    }
                }
            }
        }

        gameState = ENUM_GAMESTATE_WON_CONFIRMED;

        outer: for (let y = 0; y < boardTilesH; y++)
        {
            for (let x = 0; x < boardTilesW; x++)
            {
                const boardPos = board[y][x];

                if (boardPos.direction === 'x')
                    continue;

                if (boardPos.confirmed === ENUM_TILESTATUS_VALIDWORD)
                    gameState = ENUM_GAMESTATE_WON_ORIGINAL;

                if (boardPos.confirmed === ENUM_TILESTATUS_INVALID)
                {
                    gameState = ENUM_GAMESTATE_NOTWON;
                    break outer;
                }
            }
        }
    }

    let lastGameState = gameState;
    function update(): void
    {
        rescale();

        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        renderBoard();
        renderTiles();

        if (gameState !== lastGameState)
        {
            if (gameState === ENUM_GAMESTATE_WON_CONFIRMED)
                alert("YOU WIN");
            else if (gameState === ENUM_GAMESTATE_WON_ORIGINAL)
                alert("YOU WIN - and you found a different solution!");
        }

        lastGameState = gameState;

        requestAnimationFrame(update);
    }
    update();


    function onMouseMove(mouseX: number, mouseY: number): void
    {
        if (!selectedTile)
            return;

        selectedTile.x = mouseX + selectOffsetX!;
        selectedTile.y = mouseY + selectOffsetY!;

        snappedBoardPos = null;
        for (let y = 0; y < boardTilesH; y++)
        {
            for (let x = 0; x < boardTilesW; x++)
            {
                const boardPos = board[y][x];

                if (selectedTile.direction !== boardPos.direction || (boardPos.tile !== null && boardPos.tile !== selectedTile))
                    continue;

                const slotX = boardX + BOARD_PAD + x * (TILE_SIZE + BOARD_PAD) + TILE_SIZE / 2;
                const slotY = boardY + BOARD_PAD + y * (TILE_SIZE + BOARD_PAD) + TILE_SIZE / 2;

                let distSqr = (slotX-selectedTile.x)*(slotX-selectedTile.x) + (slotY-selectedTile.y)*(slotY-selectedTile.y);

                if (distSqr < (TILE_SIZE/2)*(TILE_SIZE/2))
                {
                    selectedTile.x = slotX;
                    selectedTile.y = slotY;
                    snappedBoardPos = boardPos;
                }
            }
        }
    }

    function onMouseDown(mx: number, my: number): void
    {
        selectedTile = null;
        for (let i = tiles.length-1; i >= 0; i--)
        {
            const tile = tiles[i];

            const l = tile.x-TILE_SIZE/2;
            const r = tile.x+TILE_SIZE/2;
            const t = tile.y-TILE_SIZE/2;
            const b = tile.y+TILE_SIZE/2;

            if (mx >= l && mx <= r && my >= t && my <= b)
            {
                selectedTile = tile;
                if (selectedTile.boardPos)
                {
                    selectedTile.boardPos.tile = null;
                    selectedTile.boardPos = null;
                }
                tiles.splice(i, 1);
                tiles.push(selectedTile);
                selectOffsetX = selectedTile.x - mx;
                selectOffsetY = selectedTile.y - my
                confirmTiles();
                break;
            }
        }

        onMouseMove(mx, my);
    }

    function onMouseUp(): void
    {
        if (selectedTile)
        {
            selectedTile.boardPos = snappedBoardPos;
            if (snappedBoardPos)
                snappedBoardPos.tile = selectedTile;
        }
        selectedTile = null;
        snappedBoardPos = null;

        confirmTiles();
    }

    gameCanvas.addEventListener('mousemove', (e) =>
    {
        onMouseMove(e.offsetX * window.devicePixelRatio, e.offsetY * window.devicePixelRatio);
    });

    gameCanvas.addEventListener('touchmove', (e) =>
    {
        onMouseMove(e.touches[0].clientX * window.devicePixelRatio, e.touches[0].clientY * window.devicePixelRatio);
    });

    gameCanvas.addEventListener('mousedown', (e) =>
    {
        onMouseDown(e.offsetX * window.devicePixelRatio, e.offsetY * window.devicePixelRatio);
    });

    gameCanvas.addEventListener('touchstart', (e) =>
    {
        onMouseDown(e.touches[0].clientX * window.devicePixelRatio, e.touches[0].clientY * window.devicePixelRatio);
    });

    gameCanvas.addEventListener('mouseup', (e) =>
    {
        onMouseUp();
    });

    gameCanvas.addEventListener('touchend', (e) =>
    {
        onMouseUp();
    });

})();