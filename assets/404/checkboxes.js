import { shuffle } from '../404_games.js';

export const NAME = 'Checkboxes';
export const DESCRIPTION = 'One of these is not like the others...<br>Find it.';

export default () => {
    const board = document.getElementById('game-board');
    board.style['display'] = 'grid';
    board.style['gridTemplateColumns'] = 'repeat(11, 1fr)';
    board.style['maxWidth'] = 'min-content';
    board.style['maxHeight'] = 'min-content';
    board.style['margin'] = '0 auto';

    const checkboxes = [];
    for (let i = 0; i < 121; i++) {
        const checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        board.appendChild(checkbox);
        checkboxes.push(checkbox);
    }
    shuffle(checkboxes);
    const real = checkboxes.pop();

    real.onclick = () => {
        checkboxes.forEach(checkbox => {
            checkbox.disabled = true;
        });
        const announcement = document.createElement('h2');
        announcement.textContent = "You won!";
        document.getElementById('game-root').appendChild(announcement);
        real.onclick = (e) => {e.stopPropagation(); return false;}
    };

    const copies = Array(...checkboxes);
    while(copies) {
        const left = copies.pop();
        const right = copies.pop();

        left.onclick = (e) => {
            right.checked = !right.checked;
            e.stopPropagation(); return false;
        };
        right.onclick = (e) => {
            left.checked = !left.checked;
            e.stopPropagation(); return false;
        };
    }
};
