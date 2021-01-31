import { connect, play } from './networking';
import { playGame } from './render';
// import { startCapturingInput, stopCapturingInput } from './input';
import { downloadAssets } from './assets';
import render from './render';
// import { initState } from './state';
// import { setLeaderboardHidden } from './leaderboard';

import './css/main.css';

const playMenu = document.getElementById('menu');
const playButton = document.getElementById('play-button');
const usernameInput = document.getElementById('username');

Promise.all([
    connect(),
    downloadAssets(),
]).then(() => {
    playMenu.classList.remove('hidden');
    usernameInput.focus();
    playButton.onclick = () => {
        // Play!
        play(usernameInput.value);
        playMenu.classList.add('hidden');
        playGame()
        // initState();
        // startCapturingInput();
        // startRendering();
        // setLeaderboardHidden(false);
    };
}).catch(console.error);