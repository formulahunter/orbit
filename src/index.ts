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
 * motivated by other similar, very well produced games; a keen interest in
 * simulations, especially physics-based sims; and a modest background in
 * aeronautics and astronautics.
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
 * Simulation structure
 *
 *  two loops
 *    - sim (main) loop runs continuously **in service worker**
 *      - used to update "global" sim state (reference frames, planets,
 *        spacecraft, etc.)
 *    - anim loop runs on browser's animation schedule
 *      - renders scene using webgl
 */
/**
 * Graphics summary
 * The simulator will feature a graphic display based on the HTML5 <canvas>
 * element, with GUI components implemented using HTML DOM elements and real-
 * time 3D rendering performed using WebGL (possibly with the help of a
 * library like three.js or similar).
 *
 * Offscreen canvas elements will be utilized to relieve the burden of
 * rendering shapes that do not change/move from one frame to the next (assuming
 * this strategy is compatible with the WebGL API).
 *
 * Some invaluable links for learning WebGL/OpenGL concepts:
 *  - developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial
 *  - https://www.creativebloq.com/javascript/get-started-webgl-draw-square-7112981
 *    - *OLD* less thorough but easier to digest tutorial; also good to compare
 *      another implementation of the same result
 *  - webglfundamentals.org
 *  - http://learnwebgl.brown37.net/index.html
 *  - learnopengl.com
 *  - https://www.khronos.org/webgl/
 *    - https://www.khronos.org/webgl/wiki/Main_Page
 *    - https://www.khronos.org/registry/OpenGL/specs/es/2.0/es_full_spec_2.0.pdf
 *
 *
 * Some resources for practical use:
 *  - ubiquitous WebGL framework/API
 *    - https://threejs.org/
 *  - used on webglfundamentals.org
 *    - http://twgljs.org/
 *  - used in MDN's WebGL tutorials
 *    - http://glmatrix.net/
 *  - glmatrix refactored as es6 module
 *    - https://unpkg.com/browse/gl-matrix@3.1.0/esm/
 *  - glmatrix TS type declarations
 *    - https://www.npmjs.com/package/@types/gl-matrix
 *  - possible pincushion transform in GLSL
 *    - https://gamedev.stackexchange.com/questions/98068/how-do-i-wrap-an-image-around-a-sphere
 *  - and another
 *    - http://marcodiiga.github.io/radial-lens-undistortion-filtering
 *
 *
 * Examples
 *  - simple 3D game in javascript with nod to WebGL & links to similar games
 *    - http://frankforce.com/?p=7427
 *  - launch simulator on flightclub.io
 *    - https://flightclub.io/earth
 *
 *
 * NASA Deep Star Maps
 *  - high-res full-sky star plots in galactic & equatorial reference frames
 *    - https://svs.gsfc.nasa.gov/3895
 *
 *
 * spherical mathsez
 *  - good explanation of spherical projection in terms of great circles
 *    - https://math.stackexchange.com/questions/92654/lat-long-grid-points-covered-by-projecting-rectangle-onto-sphere
 *  - brief, dense vector geometry notes
 *    - https://sites.math.washington.edu/~king/coursedir/m445w04/notes/vector/coord.html
 *  - generate vertices of a sphere
 *    - https://gamedev.stackexchange.com/questions/31308/algorithm-for-creating-spheres
 *  - broad projection info/reference (not just spherical)
 *    - https://proj.org/operations/projections/index.html
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
 *
 * Falcon 9 Blocks 1 - 5 booster entry energy comparison
 *  - https://www.reddit.com/r/spacex/comments/elzp52/falcon_boosters_entry_energy_comparison/
 *
 * Shahar603 on GitHub - links in "mission control" readme.md
 * - parameters for various rockets on FlightClub.io
 * - flight analysis by /u/veebay
 * - Falcon 9 systems details by /u/ap0r
 * - https://github.com/shahar603/missioncontrol
 *
 * JGM-3 coefficients (?)
 * - https://space.stackexchange.com/questions/29859/jgm-3-vs-egm2008-coefficients
 * --> http://www.csr.utexas.edu/publications/statod/TabD.3.new.txt
 */
import {OrbitGame} from './OrbitGame.js';

let game = new OrbitGame();
game.init();

