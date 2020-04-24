/**
 * Orbit - spaceflight simulator
 *
 * Hunter Gayden
 * Final project
 * CIS 228 001 15A SP20
 * Submitted May 4, 2020
 */
/**
 * Project summary
 *
 * This project is intended to be equal parts game, simulation, and educational
 * tool. It will render simple spacecraft orbiting an Earth-like planet in 3D
 * graphics and allow automated or manual control of the craft. In operating the
 * spacecraft, players will hopefully gain a deeper understanding of the
 * complexity and adventurism of space exploration. It is motivated by other
 * similar games; a keen interest in simulation, especially physics-based
 * sims; and a modest background in aeronautics and astronautics.
 */
/**
 * Project goals
 *
 * This project is written in TypeScript and heavily based on object-oriented
 * programming principles. It is designed to meet the following specific
 * goals (in order of priority):
 *
 *   1. Realistic physics based on widely-accepted principles of orbital
 *      mechanics[1]
 *   2. Performance sufficient to yield convincingly accurate physics while
 *      maintaining acceptable animation quality
 *   3. Allowing the player to evaluate and manipulate any/all of the physical
 *      parameters affecting the simulation
 *   4. Representation of all phases of orbital spaceflight
 *        a. launch
 *        b. orbital maneuvers
 *          i. rendezvous & docking
 *        c. reentry
 *   5. (Reasonably) realistic 3D graphics
 *
 * Notably missing from this list is compatibility across browser vendors &
 * versions, as well as across platforms (i.e. phone vs. tablet vs pc). The
 * academic purpose of this project tends to favor richness of the feature
 * set over breadth of compatibility, and the very limited deployment target
 * mostly eliminates concern for the latter anyway.
 *
 * [1] https://en.wikipedia.org/wiki/Orbital_mechanics
 */
/**
 * Development schedule
 *
 * Development will begin with the underlying physics models. Geometric and
 * kinematic concepts will be formalized and implemented first. Kinetics will be
 * built on top of those, followed by more domain-specific topics
 * (atmospheric modeling, inter-planetary dynamics). During this phase, a simple
 * console interface (analogous to a CLI) will be implemented, likely as a
 * static API on the game's class object, for testing these abstract models.
 *
 * Periodically during model implementation, critical input parameters will be
 * identified for manipulation in the GUI, which will be generally comprise the
 * second major stage of development. This may be the most time-consuming
 * phase and involve exhaustive testing and iteration, owing to the tedious
 * natures of HTML and CSS. If the Vue framework has been covered as a course
 * topic with enough time left before the project due date, that may be
 * incorporated into the GUI.
 *
 * Finally will come "hallway" testing, debugging and implementation tweaks
 * abound. This won't so much be a separate phase of the development process but
 * rather will proceed simultaneously with the other two stages.
 */
/**
 * Simulation structure
 *
 *  - two loops
 *    - sim (main) loop runs continuously, possibly in service worker
 *      - used to update "global" sim state (reference frames, planets,
 *        spacecraft, etc.)
 *    - anim loop runs on browser's animation schedule
 *      - renders scene using webgl
 */
/**
 * Data transfer strategy
 *
 * - considering use of SharedArrayBuffers
 *   - would significantly speed messages between control & sim (in service
 *     worker)
 *     - https://github.com/tc39/ecmascript_sharedmem/blob/master/TUTORIAL.md
 *   - disabled by default in firefox (and others) as of 1/5/2018 due to
 *     security vulnerabilities discovered
 *     - https://spectreattack.com/
 *     - https://spectreattack.com/spectre.pdf
 *     - https://blog.mozilla.org/security/2018/01/03/mitigations-landing-new-class-timing-attack/
 *     - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer/Planned_changes
 *     - https://www.sitepen.com/blog/the-return-of-sharedarraybuffers-and-atomics/
 * - parlib may help manage parallel/async operations and load balancing
 *   - https://github.com/lars-t-hansen/parlib-simple
 *
 */
/**
 * Graphics summary
 *
 * The simulator will feature a graphic display based on the HTML5 <canvas>
 * element, with GUI components implemented using HTML DOM elements and real-
 * time 3D rendering performed using WebGL (possibly with the help of a
 * library like three.js or similar).
 *
 * Offscreen canvas elements will be utilized to relieve the burden of
 * rendering shapes that do not change/move from one frame to the next (assuming
 * this strategy is compatible with the WebGL API).
 */
import {OrbitGame} from './OrbitGame.js';

let game = new OrbitGame();
game.init();

