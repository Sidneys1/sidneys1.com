export const NAME = 'Life';
export const DESCRIPTION = '🍄';

const SIZE = 20;

class Life {
    /** @type {HTMLButtonElement} */
    #play_pause;

    /** @type {HTMLInputElement} */
    #slider;

    /** @type {HTMLInputElement[]} */
    #checkboxes = [];

    /** @type {number?} */
    #interval_token = undefined;

    /**
     * @param {HTMLDivElement} board
     */
    constructor(board) {
        board.style['display'] = 'grid';
        board.style['gridTemplateColumns'] = `repeat(${SIZE}, 1fr)`;
        board.style['maxWidth'] = 'min-content';
        board.style['maxHeight'] = 'min-content';
        board.style['margin'] = '0 auto';

        this.#play_pause = document.createElement('button');
        this.#play_pause.id = 'play-pause';
        this.#play_pause.innerText = '▶️ Play';
        this.#play_pause.addEventListener('click', this.#on_play_pause_click);

        const root = document.getElementById('game-root');
        root.appendChild(this.#play_pause);

        this.#slider = document.createElement('input');
        this.#slider.type = 'range';
        this.#slider.min = 1;
        this.#slider.max = 60;
        this.#slider.value = 1;

        this.#slider.addEventListener('change', e => {
            console.log(`Value changed to ${this.#slider.value}`);
            if (this.#interval_token === undefined)
                return;
            clearInterval(this.#interval_token);
            this.#interval_token = setInterval(this.#tick, 1.0 / Number(this.#slider.value) * 1000);
        })

        root.appendChild(this.#slider);


        for (let y = 0; y < SIZE; y++) {
            for (let x = 0; x < SIZE; x++) {
                const checkbox = document.createElement('input');
                checkbox.type = "checkbox";
                board.appendChild(checkbox);
                this.#checkboxes.push(checkbox);
            }
        }
    }

    #tick = () => {
        const old_state = this.#checkboxes.map(c => c.checked);

        for (let y = 0; y < SIZE; y++) {
            for (let x = 0; x < SIZE; x++) {
                const checkbox = this.#checkboxes[x + y * SIZE];

                let count = 0;
                for (let iy = -1; iy < 2; iy++) {
                    for (let ix = -1; ix < 2; ix++) {
                        let ox = x, oy = y;
                        if (ix === 0 && iy === 0) continue;

                        if (x === 0 && ix === -1) ox = SIZE;
                        if (x === SIZE - 1 && ix === 1) ox = -1;
                        if (y === 0 && iy === -1) oy = SIZE;
                        if (y === SIZE - 1 && iy === 1) oy = -1;

                        if (old_state[ox + ix + (oy + iy) * SIZE])
                            count++;
                    }
                }

                if (old_state[x + y * SIZE]) {
                    if (count < 2 || count > 3)
                        checkbox.checked = false;
                } else if (count === 3)
                        checkbox.checked = true;
            }
        }
    }

    #on_play_pause_click = e => {
        if (this.#interval_token === undefined) {
            this.#play_pause.innerText = '⏸️ Pause';
            this.#interval_token = setInterval(this.#tick, (1.0 / Number(this.#slider.value)) * 1000);
        } else {
            this.#play_pause.innerText = '▶️ Play';
            clearInterval(this.#interval_token);
            this.#interval_token = undefined;
        }
    }
}

export default () => {
    new Life(document.getElementById('game-board'));
};
