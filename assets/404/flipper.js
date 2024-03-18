// import { reset } from '../404_games.js';

export const NAME = 'Flipper';
export const DESCRIPTION = 'Fill it in.';

const INITIAL_WIDTH = 3;
const INITIAL_HEIGHT = 3;
const WAIT = 2.0;

const check = (checkboxRoot, width, height) => {
    const children = Array.from(checkboxRoot.children);
    if (!children.every(c => c.checked))
        return;
    children.forEach(c => c.disabled = true);
    const announcement = document.getElementById('announcement');

    announcement.innerHTML = `You won the ${width}x${height}...`;
    setInterval(() => {
        announcement.innerHTML = `Now try ${width + 1}x${height + 1}.`;
        init(checkboxRoot, width + 1, height + 1);
    }, WAIT * 1000);
};

const init = (checkboxRoot, width, height) => {
    checkboxRoot.innerHTML = '';
    checkboxRoot.style['gridTemplateColumns'] = `repeat(${width}, 1fr)`;

    for (let y = 0; y < width; y++) {
        for (let x = 0; x < height; x++) {
            const checkbox = document.createElement('input');
            checkbox.type = "checkbox";
            checkbox.id = `${x}-${y}`;
            checkbox.dataset.x = x;
            checkbox.dataset.y = y;
            checkboxRoot.appendChild(checkbox);

            checkbox.onclick = (e) => {
                const x = Number(e.target.dataset.x);
                const y = Number(e.target.dataset.y);
                if (x !== 0) {
                    const left = document.getElementById(`${x - 1}-${y}`);
                    left.checked = !left.checked;
                }
                if (x !== width - 1) {
                    const right = document.getElementById(`${x + 1}-${y}`);
                    right.checked = !right.checked;
                }
                if (y !== 0) {
                    const up = document.getElementById(`${x}-${y - 1}`);
                    up.checked = !up.checked;
                }
                if (y !== height - 1) {
                    const down = document.getElementById(`${x}-${y + 1}`);
                    down.checked = !down.checked;
                }
                check(checkboxRoot, width, height);
            };
        }
    }
};

export default () => {
    const board = document.getElementById('game-board');
    board.style['display'] = 'grid';
    // board.style['gridTemplateColumns'] = 'repeat(11, 1fr)';
    board.style['maxWidth'] = 'min-content';
    board.style['maxHeight'] = 'min-content';
    board.style['margin'] = '0 auto';

    init(board, INITIAL_WIDTH, INITIAL_HEIGHT);

    const announcement = document.createElement('p');
    announcement.id = 'announcement';
    document.getElementById('game-root').appendChild(announcement);
};

window.onload = () => {
};
