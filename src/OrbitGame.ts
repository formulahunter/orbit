


class OrbitGame {

    // @ts-ignore
    private canvas: HTMLCanvasElement;

    constructor() {

        //  the HTML document must include a <canvas id="viewport">
        let canvas = document.getElementById('viewport');
        if(!(canvas instanceof HTMLCanvasElement)) {
            console.debug(`document.getElementById('viewport') returned ${canvas}`);
            throw new TypeError('error retrieving viewport <canvas> element');
        }
        this.canvas = canvas;
    }
}


export default OrbitGame;
