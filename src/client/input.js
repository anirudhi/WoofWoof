import { updateDirection } from './networking';

function onMouseInput(e) {
    handleInput(e.clientX, e.clientY);
}

function onTouchInput(e) {
    const touch = e.touches[0];
    handleInput(touch.clientX, touch.clientY);
}

function onKeyboardInput(e) {
    const key = e.key; // "ArrowRight", "ArrowLeft", "ArrowUp", or "ArrowDown"
}

function handleInput(x, y) {
    const dir = Math.atan2(x - window.innerWidth / 2, window.innerHeight / 2 - y);
    updateDirection(dir);
}

export function startCapturingInput() {
    window.addEventListener('keydown', onKeyboardInput);
}

export function stopCapturingInput() {
    window.removeEventListener('keydown', onKeyboardInput);
}