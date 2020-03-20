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
/**
 * Geometric calculations in 3 dimensions
 *
 * In 3D geometry, certain transformations (e.g. translations) cannot be
 * concisely represented but instead require calculations involving multiple
 * steps. These computations can be performed more efficiently with the use of
 * homogeneous coordinates[1], which are very commonly used in computer graphics
 * for that reason.
 *
 * Of note, the projective geometry that defines homogeneous coordinates also
 * unifies (or "homogenizes") the the intuitively distinct definitions of points
 * and lines so that, for example, the equation of a line passing through two
 * points can be derived by matrix multiplication of the homogeneous coordinates
 * of those two points. This property of projective geometry is referred to as
 * point-line duality[2].
 *
 * The main application of homogeneous coordinates in computer graphics is the
 * implementation of affine transformations[3]. This category of transformations
 * includes the simpler linear transformations[4] (which by themselves can be
 * defined in terms of matrix multiplication without the addition of an extra
 * dimension), in addition to translation, an essential operation in 3D
 * simulations. Because linear translations are a subset of affine
 * transformations, they can also be defined by matrix multiplication when the
 * additional dimension is present.
 *
 * Accommodations are made in geospatial classes for performing calculations in
 * homogeneous coordinates, though these calculations are not yet implemented
 * (at time of writing).
 *
 * [1] https://en.wikipedia.org/wiki/Homogeneous_coordinates
 * [2] https://en.wikipedia.org/wiki/Duality_(projective_geometry)
 * [3] https://en.wikipedia.org/wiki/Transformation_matrix#Affine_transformations
 * [4] https://en.wikipedia.org/wiki/Linear_map
 */
/**
 * TODO - check for reasonable length of Vector component strings
 *
 * NASA - analysis of propellant tank masses
 * - includes tables of dry/propellant/engine masses for dozens of rockets
 * - https://www.nasa.gov/pdf/382034main_018%20-%2020090706.05.Analysis_of_Propellant_Tank_Masses.pdf
 *
 * sciencelearn.org - calculating rocket acceleration
 * - parameters of Space Shuttle launch profile: @t=0 a=5.25m/s2, @t=124s
 *   H=45km v=1380m/s, @t=~480 H=300km v=28000km/h
 * - https://www.sciencelearn.org.nz/resources/397-calculating-rocket-acceleration
 *
 * Wikipedia - Falcon 9 Full Thrust
 * - lots of data on the Falcon 9 Blocks 1 - 5
 * - https://en.wikipedia.org/wiki/Falcon_9_Full_Thrust
 */

import CoordinateSystem from './kinematics/CoordinateSystem.js';
import OrbitGame from './OrbitGame.js';
import Spacecraft from './Spacecraft.js';

let ecliptic = new CoordinateSystem('ecliptic');
console.log(ecliptic.parent.toString());

let game = new OrbitGame();
let craftCount: number = game.addCraft(new Spacecraft('Explorer 1'));
console.log(`${craftCount} spacecraft`);
let explorer1: Spacecraft = game.getCraft(0);
console.log(explorer1);
console.log(explorer1 === game.removeCraft(0));
game.addCraft(explorer1);
console.log(game.removeCraft(explorer1));

