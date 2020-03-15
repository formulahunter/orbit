/** Orbit - spaceflight simulator
 *
 * Hunter Gayden
 * Final project
 * CIS 228 001 15A SP20
 * Submitted April 27, 2020
 *
 */
/**
 * Project summary
 * This project is intended to be equal parts game, simulation, and educational
 * tool. It will render simple spacecraft orbiting an Earth-like planet in 3D
 * graphics and allow automated or manual control of the craft. In operating the
 * spacecraft, players will hopefully gain a deeper appreciation for and
 * understanding of the complexity and adventurism of space exploration. It is
 * motivated by other similar, very well produced games as well as a keen
 * interest in aeronautics and astronautics.
 */
/**
 * Project goals
 * This project is written in TypeScript and heavily based on object-oriented
 * programming principles. It is designed specifically with the following
 * goals (in order of priority):
 *
 *   1. Realistic physics based on widely-accepted principles of orbital
 *      mechanics[1]
 *   2. Allowing the player to evaluate and manipulate any/all of the physical
 *      parameters affecting the simulation
 *   3. Representation of all phases of orbital spaceflight
 *        a. launch
 *        b. orbital maneuvers
 *          i. rendezvous & docking
 *        c. reentry
 *   4. (Reasonably) realistic 3D graphics
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
 * Graphics summary
 * The simulator will feature a graphic display based on the HTML5 <canvas>
 * element, with GUI components implementing using HTML DOM elements and real-
 * time 3D rendering performed using WebGL.
 */
/**
 * Development schedule
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

// import OrbitGame from './OrbitGame.js';
import CoordinateSystem from './kinematics/CoordinateSystem.js';

//@ts-ignore
// let game = new OrbitGame();

let ecliptic = new CoordinateSystem('ecliptic');
console.log(ecliptic.parent.toString());
