let currentAudio = new Audio();
currentAudio.preload = "metadata"; // Preload metadata to make duration available
let songs;
let currFolder;
let isPlaying = false; // Track if the audio is currently playing
let isChangingTrack = false; // Track if a track change is in progress

function formatTime(seconds) {
    seconds = Math.floor(seconds);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

function setupSongClickListeners() {
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            let displayedName = e.querySelector(".info").firstElementChild.innerHTML.trim();
            let songName = songs.find(song => decodeURIComponent(song.replace(/[_0-9%]/g, ' ').replace('.mp', '').trim()) === displayedName);
            console.log("Song to be played:", songName);
            if (songName) {
                playMusic(songName);
            } else {
                console.error("Song not found for display name:", displayedName);
            }
        });
        return songs;
    });
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`http://127.0.0.1:3000/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            // Decode song names correctly
            songs.push(decodeURIComponent(element.href.split(`/${folder}/`)[1]));
        }
    }
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML += `<li> <img class="invert" src="music.svg" alt="">
                            <div class="info">
                                <div> ${decodeURIComponent(song.replace(/[_0-9%]/g, ' ').replace('.mp', '').trim())} </div>
                                <div>Sonam</div>
                            </div>
                            <div class="playnow">
                                <span>Play Now</span>
                            <img class="invert" src="play.svg" alt="">
                        </div></li>`;
    }

    setupSongClickListeners(); // Set up click listeners for the new songs
}

const playMusic = (track, pause = false) => {
    track = track.trim().replace(/\s+/g, ' ');
    let audioUrl = `/${currFolder}/` + encodeURIComponent(track);

    // If we are already changing tracks, prevent further action
    if (isChangingTrack) return;

    // Set a flag to indicate track change is in progress
    isChangingTrack = true;

    // Stop and reset the currently playing audio
    if (!currentAudio.paused) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    // Set the new source and handle play/pause
    currentAudio.src = audioUrl;
    document.querySelector(".songinfo").innerHTML = decodeURIComponent(track.replace(/[_0-9%]/g, ' ').replace('.mp', '').trim());
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

    if (!pause) {
        currentAudio.play().then(() => {
            // Handle metadata load after play starts
            currentAudio.addEventListener('loadedmetadata', () => {
                document.querySelector(".songtime").innerHTML = `00:00 / ${formatTime(currentAudio.duration)}`;
            });
            play.src = "pause.svg";
            isPlaying = true; // Update the play state
            isChangingTrack = false; // Reset the flag after successful play
        }).catch((error) => {
            console.error("Failed to play audio:", error);
            isChangingTrack = false; // Reset the flag on error
        });
    } else {
        // Set the source but do not play
        play.src = "play.svg";
        isPlaying = false; // Update the play state
        isChangingTrack = false; // Reset the flag
    }

    // Debugging output to ensure the correct track is being loaded
    console.log(`Attempting to play track: ${track}, URL: ${audioUrl}`);
};

async function displayAlbums() {
    let a = await fetch(`http://127.0.0.1:3000/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    let cardContiner = document.querySelector(".cardContainer");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
   
    let array = Array.from(anchors)
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if(e.href.includes("/songs")) {
            let folder = e.href.split("/").slice(-2)[0];
            let a = await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json`);
            let response = await a.json();
            console.log(response);
            cardContiner.innerHTML += `  <div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="50" cy="50" r="50" fill="#1ed760" />
                                <g transform="translate(20, 20)">
                                    <svg width="60" height="60" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
                                        color="#000000" fill="none">
                                        <path
                                            d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z"
                                            fill="black" stroke="currentColor" stroke-width="1.5"
                                            stroke-linejoin="round" />
                                    </svg>
                                </g>
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="">
                        <h2>${response.title}</h2>
                        <p>${response.description}</p>
                    </div>`;
        }
    }
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async (item) => {
            await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            setupSongClickListeners(); // Ensure song click listeners are set up after loading songs
            playMusic(songs[0]);
        });
    });
}

async function main() {
    await getSongs("songs/ncs");

    // Set up the first song and preload its metadata
    playMusic(songs[0], true);

    displayAlbums();

    play.addEventListener("click", () => {
        if (!currentAudio.src) {
            // If src is not set, play the first song
            playMusic(songs[0]);
        } else {
            // Toggle between play and pause
            if (isPlaying) {
                currentAudio.pause();
                play.src = "play.svg";
                isPlaying = false;
            } else {
                currentAudio.play().then(() => {
                    play.src = "pause.svg";
                    isPlaying = true;
                }).catch((error) => {
                    console.error("Failed to play audio:", error);
                });
            }
        }
    });

    // Attach timeupdate listener to the currentAudio object
    currentAudio.addEventListener("timeupdate", () => {
        if (isFinite(currentAudio.duration)) {
            document.querySelector(".songtime").innerHTML = `${formatTime(currentAudio.currentTime)} / ${formatTime(currentAudio.duration)}`;
            document.querySelector(".circle").style.left = (currentAudio.currentTime / currentAudio.duration) * 100 + "%";
        }
    });

    // Add 'ended' event listener to play next song automatically
   // 'ended' event listener to play the next song automatically
currentAudio.addEventListener("ended", () => {
    let currentTrackName = decodeURIComponent(currentAudio.src.split("/").slice(-1)[0]);
    let index = songs.findIndex(song => decodeURIComponent(song) === currentTrackName);

    // Check if there is a next song in the list
    if (index < songs.length - 1) {
        playMusic(songs[index + 1]); // Play the next song if it's not the last one
    } else {
        playMusic(songs[0]); // If it's the last song, loop back to the first song
    }
});


    // Seek bar click listener
    document.querySelector(".seekbar").addEventListener("click", e => {
        // Check if metadata is loaded
        if (isNaN(currentAudio.duration) || currentAudio.duration === 0) {
            console.error("Cannot seek: Audio duration is not available yet.");
            return;
        }

        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentAudio.currentTime = ((currentAudio.duration) * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    next.addEventListener("click", () => {
        let currentTrackName = decodeURIComponent(currentAudio.src.split("/").slice(-1)[0]);
        let index = songs.findIndex(song => decodeURIComponent(song) === currentTrackName);
        
        if (index < songs.length - 1) {
            playMusic(songs[index + 1]); // Play the next song if it's not the last one
        } else {
            playMusic(songs[0]); // If it's the last song, loop to the first song
        }
    });
    
    previous.addEventListener("click", () => {
        let currentTrackName = decodeURIComponent(currentAudio.src.split("/").slice(-1)[0]);
        let index = songs.findIndex(song => decodeURIComponent(song) === currentTrackName);
        
        if (index > 0) {
            playMusic(songs[index - 1]); // Play the previous song if it's not the first one
        } else {
            playMusic(songs[songs.length - 1]); // If it's the first song, loop to the last song
        }
    });

    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentAudio.volume = parseInt(e.target.value) / 100;
    });

    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentAudio.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentAudio.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    });

    setupSongClickListeners();
}

main();
