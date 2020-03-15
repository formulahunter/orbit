/** Orbit - spaceflight simulator
 *
 * Hunter Gayden
 * Final project
 * CIS 228 001 15A SP20
 * Submitted April 27, 2020
 *
 */
/**
 * This project is intended to be equal parts game, simulation, and educational
 * tool. It will render simple spacecraft orbiting an Earth-like planet in 3D
 * graphics and allow automated or manual control of the craft. In operating the
 * spacecraft, players will hopefully gain a deeper appreciation for and
 * understanding of the complexity and adventurism of space exploration. It is
 * motivated by other similar, very well produced games as well as a keen
 * interest in aeronautics and astronautics.
 */
/**
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
 * The simulator will feature a graphic display based on the HTML5 <canvas>
 * element, with GUI components implementing using HTML DOM elements and real-
 * time 3D rendering performed using WebGL.
 */
/**
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
 * Caching calculated properties/values
 * In some of the model classes I've included a means of caching property values
 * for expedited access, namely in classes with numeric properties that are
 * used to render the simulation and may change over time. The strategy used
 * aims to minimize CPU overhead by performing calculations only when necessary.
 *
 * Some of the first and best examples are the Point and Vector classes, which
 * both represent axial components in two- or three-dimensional space and
 * automatically convert between Cartesian and polar/spherical coordinates.
 * If these classes were implemented based on one system or the other, they
 * would have to explicitly calculate component values in the other system every
 * time they were needed.
 *
 * Instead, these classes calculate component values only once and cache the
 * results for as long as they are valid so they are available next time they
 * they're needed. If one component is changed, the other two components in the
 * same coordinate system are unaffected and their values, if already cached,
 * remain valid. In contrast, all three components in the other coordinate
 * system are affected, so the implementation automatically invalidates those
 * three components and will calculate their new values when/if they are needed.
 *
 * This procedure optimizes the time spent computing such values, particularly
 * in situations where, for example, a Point's location may be manipulated in
 * terms of its spherical coordinates repeatedly over a short period of time,
 * only to have its Cartesian coordinates accessed some time after the series of
 * operations is finished. That Point instance performs nearly as well as if
 * it were implemented based exclusively on the spherical coordinate system
 * during the series of rapid access and modification, but also has a native
 * means of converting its position in terms of a different coordinate system
 * whose values will be cached in the same way after the first time they are
 * calculated).
 */

// import OrbitGame from './OrbitGame.js';
import CoordinateSystem from './kinematics/CoordinateSystem.js';
// @ts-ignore
import Vector from './kinematics/Vector.js';

//@ts-ignore
// let game = new OrbitGame();

let ecliptic = new CoordinateSystem('ecliptic');
console.log(ecliptic.parent.toString());

//@ts-ignore
let vec = new Vector(1, 2, 3, false);
console.log(`{${vec.x}, ${vec.y}, ${vec.z}}`);

let test: Vector[] = [
    new Vector(0, 0, 0, false),
    new Vector(0, 0, 0, true),
    new Vector(1, 2, 3),
    new Vector(1, 2, 3, false),
    new Vector(1, 2, 3, true)
];

console.log(
    'test 0 cartesian: ', test[0].cartesianString, '\n',
    'test 0 spherical: ', test[0].sphericalString, '\n',
    'test 1 cartesian: ', test[1].cartesianString, '\n',
    'test 1 spherical: ', test[1].sphericalString, '\n',
    'test 2 cartesian: ', test[2].cartesianString, '\n',
    'test 2 spherical: ', test[2].sphericalString, '\n',
    'test 3 cartesian: ', test[3].cartesianString, '\n',
    'test 3 spherical: ', test[3].sphericalString, '\n',
    'test 4 cartesian: ', test[4].cartesianString, '\n',
    'test 4 spherical: ', test[4].sphericalString, '\n'
);
console.log(180*test[2].theta/Math.PI, 180*test[2].phi/Math.PI);
