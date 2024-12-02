// @ts-check
console.debug('Loaded DCT JavaScript!');

/** @type {string[]} */
const COLORS = ['orange', 'gold', 'blue', 'indigo', 'violet'];

/** @returns {number} */
function PixelRatio(ctx) {
    const dpr = window.devicePixelRatio || 1;
    const bsr = ctx.backingStorePixelRatio ||
                ctx.webkitBackingStorePixelRatio ||
                ctx.mozBackingStorePixelRatio ||
                ctx.msBackingStorePixelRatio ||
                ctx.oBackingStorePixelRatio ||
                1;
    return dpr / bsr;
}

class Waves {
    /** @type {HTMLCanvasElement} */
    canvas;
    /** @type {CanvasRenderingContext2D} */
    ctx;
    /** @type {number} */
    width;
    /** @type {number} */
    height;
    /** @type {number[]} */
    terms = [];
    /** @type {((x: number) => number)[]} */
    term_fns = [];
    /** @type {number[]} */
    input_terms = [];

    /** @type {{mean:boolean;solve:boolean;readonly:boolean;}} */
    opts = {
        mean: true,
        solve: false,
        readonly: false,
    };

    /** @type {string} */
    bg_color;

    /** @type {number} */
    offset;

    /** @type {number[]|undefined} */
    src;

    /** @type {number} */
    show_terms;

    /** @type {HTMLInputElement[]} */
    inputs = [];


    /**
     * @param {HTMLCanvasElement} canvas
      */
    constructor(canvas) {
        this.canvas = canvas;

        // setInterval(() => {
        //     let rect = canvas.getBoundingClientRect();
        //     if (Math.round(rect.x) !== rect.x) {
        //         console.warn(`Canvas unaligned (x=${rect.x})!`);
        //     }
        //     if (Math.round(rect.y) !== rect.y) {
        //         rect = (canvas.parentElement??canvas).getBoundingClientRect();
        //         const diff = -rect.y % 1;
        //         console.warn(`Canvas unaligned (y=${rect.y}; ${diff})!`);
        //         canvas.style.position = 'absolute';
        //         canvas.style.top = `${diff}px`;
        //     }
        // }, 1000);

        this.opts.mean = canvas.dataset.mean !== 'false';
        this.opts.solve = canvas.dataset.solve === 'true';
        this.opts.readonly = canvas.dataset.readonly === 'true';

        console.debug('Opts:', this.opts);

        const ctx = canvas.getContext('2d', {alpha: false});
        if (!(ctx instanceof CanvasRenderingContext2D)) throw "Invalid 2D context.";
        this.ctx = ctx;

        let parent = canvas.parentElement ;
        while (parent !== null) {
            const style = window.getComputedStyle(parent).background;
            if (style !== 'none') {
                this.bg_color = style;
                document.querySelectorAll("#theme-select input[name='mode']").forEach(input => {
                    if (!(input instanceof HTMLInputElement)) throw 'Oops!';
                    input.addEventListener('change', e => {
                        if (parent === null) throw 'Ooops!';
                        this.bg_color = window.getComputedStyle(parent).background;
                        this.redraw();
                    });
                })
                break;
            }
            parent = parent.parentElement;
        }

        const width = this.width = canvas.width = canvas.parentElement?.getBoundingClientRect().width ?? canvas.width;
        const height = this.height = canvas.height = canvas.parentElement?.getBoundingClientRect().height ?? canvas.height;
        const ratio = PixelRatio(ctx);
        if (ratio !== 1) {
            console.info(`Resizing canvas with pixel ratio 1:${ratio} from ${width}x${height} to ${width * ratio}x${height * ratio}`);
            canvas.style.width = `${canvas.width}px`;
            canvas.style.height = `${canvas.height}px`;
            canvas.width = width * ratio;
            canvas.height = height * ratio;
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        } else {
            console.info('Not resizing canvas (ratio is 1:1);')
        }

        this.setup();

        this.redraw();
    }

    setup() {
        const terms = Number(this.canvas.dataset.terms ?? '1');
        this.show_terms = terms;
        const total_width = 200 * (terms + 2);
        this.offset = (this.width - total_width) / 2;
        this.ctx.translate(this.offset, 0);

        for (let i = 0; i < terms; i++) {
            let term = Math.round((Math.random() * 2 - 1) * 100);
            while (term < 0.1 && term > -0.1) term = Math.random();
            const solve_term = this.opts.solve ? term : (Math.round((Math.random() * 2 - 1  ) * 100));
            this.terms.push(solve_term);
            this.input_terms.push(term);
            this.term_fns.push(x => Math.cos((Math.PI/64) * (x + 0.5) * i));

            if (this.opts.readonly) continue;

            const input = document.createElement('input');
            input.type = 'range';
            input.max = '800';
            input.min = '-800';
            input.value = String(solve_term);
            input.style.position = 'absolute';
            input.style.margin = '0';
            input.style.width = '128px';
            input.style.left = `${(200 * (i + 1) + 20) + this.offset}px`;
            input.style.top = '225px';
            input.oninput = e => {
                this.terms[i] = Number(input.value);
                this.redraw_term(i);
            };
            this.inputs.push(input);
            this.canvas.parentElement?.appendChild(input);
        }
        const input_terms = Number(this.canvas.dataset.inputTerms ?? terms);
        for (let i = terms; i < input_terms; i++) {
            let term = Math.round((Math.random() * 2 - 1) * 100);
            while (term < 0.1 && term > -0.1) term = Math.round((Math.random() * 2 - 1) * 100);
            this.input_terms.push(term);
            this.term_fns.push(x => Math.cos((Math.PI/64) *(x+0.5)* i));
        }
        for (let i = terms; i < 64; i++) {
            this.terms.push(0);
        }

        console.debug('Terms:', this.input_terms);
    }

    /**
     * @param {number} i
     */
    redraw_term(i) {
        this.ctx.fillStyle = this.bg_color;
        this.ctx.fillRect(200 * (i + 1) + 10, 0, 148, this.height);
        this.ctx.fillRect(200 * (this.show_terms + 1) + 10, 0, 148, this.height);
        this.draw_graph([200 * (i + 1) + 20, 75], x => this.term_fns[i](x) * (this.terms[i] / 100), {title: `cos(${i==0?'':i+1}𝑥)⋅(θ=${this.terms[i]/100})`, color: COLORS[i]});
        this.ctx.fillStyle = 'grey';
        // this.ctx.font = '11pt sans-serif';
        // const value_text = `θ = ${(this.terms[i] / 100).toFixed(2)}`;
        // const measure = this.ctx.measureText(value_text);
        // this.ctx.fillText(value_text, 200 * (i + 1) + 84 - Math.round(measure.width / 2), 128+75+5+Math.round(measure.actualBoundingBoxAscent));

		const correct = this.terms.length == this.input_terms.length && this.terms.every((value, index) => value === this.input_terms[index]);
        this.draw_graph(
            [200 * (this.show_terms + 1) + 20, 75],
            k => {
                const sum = [];
                for (let n = 1; n < 64; n++) {
                    const xn = n >= this.terms.length ? 0 : (this.terms[n] / 100);
                    sum.push(xn*Math.cos(Math.PI/64*(k + 0.5)*n))
                }
                const sum_result = sum.reduce((a,b)=>a+b);
                return (((this.terms[0]/100)/Math.sqrt(2)) + sum_result) * Math.sqrt(2/64);
                // return this.terms.map((t, i) => this.term_fns[i](x) * (t / 100)).reduce((p, n) => p - n, this.input_fn(x))
            },
            {
                title: 'Output',
                color: correct ? 'green' : 'red',
                title_font: 'bold 12pt sans-serif',
                thickness: 4,
        });
    }

    redraw() {
        this.ctx.fillStyle = this.bg_color;
        this.ctx.fillRect(-this.offset, 0, this.width, this.height);

        this.draw_graph([20, 75], (x) => this.input_fn(x), {title: 'Input', color: 'white', title_font: 'bold 12pt sans-serif', thickness: 4});

        for (let i = 0; i < this.show_terms; i++) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.moveTo(200 * (i + 1) - 3, 75 + 64);
            this.ctx.lineTo(200 * (i + 1) - 33, 75 + 64);
            this.ctx.lineCap = 'round';
            this.ctx.lineWidth = 5;
            this.ctx.strokeStyle = 'grey';
            this.ctx.stroke();
            this.ctx.restore();

            this.draw_graph([200 * (i + 1) + 20, 75], x => this.term_fns[i](x) * (this.terms[i] / 100), {title: `cos(${i==0?'':i+1}𝑥)⋅(θ=${this.terms[i]/100})`, color: COLORS[i]});

            // this.ctx.fillStyle = 'grey';
            // this.ctx.font = '11pt sans-serif';
            // const value_text = `θ = ${this.terms[i].toFixed(2)}`;
            // const measure = this.ctx.measureText(value_text);
            // this.ctx.fillText(value_text, 200 * (i + 1) + 84 - Math.round(measure.width / 2), 128+75+5+Math.round(measure.actualBoundingBoxAscent));
        }

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(200 * (this.show_terms + 1) - 3, 75 + 54);
        this.ctx.lineTo(200 * (this.show_terms + 1) - 33, 75 + 54);
        this.ctx.moveTo(200 * (this.show_terms + 1) - 3, 75 + 74);
        this.ctx.lineTo(200 * (this.show_terms + 1) - 33, 75 + 74);
        this.ctx.lineCap = 'round';
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = 'grey';
        this.ctx.stroke();
        this.ctx.restore();

        const correct = this.terms.length == this.input_terms.length && this.terms.every((value, index) => value === this.input_terms[index]);
        this.draw_graph(
            [200 * (this.show_terms + 1) + 20, 75],
            k => {
                const sum = [];
                for (let n = 1; n < 64; n++) {
                    const xn = this.terms[n]/100;
                    sum.push(xn*Math.cos(Math.PI/64*(k + 0.5)*n))
                }
                const sum_result = sum.reduce((a,b)=>a+b);
                const x0 = this.terms[0]/100;
                return ((x0/Math.sqrt(2)) + sum_result) * Math.sqrt(2/64);
                // return this.terms.map((t, i) => this.term_fns[i](x) * (t / 100)).reduce((p, n) => p - n, this.input_fn(x))
            },
            {
                title: 'Output',
                color: correct ? 'green' : 'red',
                title_font: 'bold 12pt sans-serif',
                thickness: 4,
        });
    }

    /**
     *
     * @param {number} x
     * @param {number} [y]
     * @returns
     */
    input_fn(x) {
        if (this.src !== undefined)
            return this.src[x];
        let ret = 0;
        for (let i = 0; i < this.input_terms.length; i++)
            ret += this.term_fns[i](x) * (this.input_terms[i] / 100);

        return ret;
    };

    /**
     * @param {[number, number]} pos
     * @param {(x: number, i?: number) => number} fn
     * @param {{title?:string;color?:string;title_font?:string;thickness?:number;}} [props]
     */
    draw_graph(pos, fn, props) {
        this.ctx.save();

        this.ctx.translate(...pos);

        // this.ctx.strokeStyle = '#ddd';
        // this.ctx.strokeRect(0, 0, 128, 128);

        this.ctx.beginPath();
        this.ctx.moveTo(0, 64.5);
        this.ctx.lineTo(128, 64.5);

        this.ctx.moveTo(0.5, 0);
        this.ctx.lineTo(0.5, 128);
        this.ctx.strokeStyle = '#666';
        this.ctx.stroke();

        this.ctx.fillStyle = 'grey';
        this.ctx.font = '10pt serif';
        let measure = this.ctx.measureText('0');
        this.ctx.fillText('1', -(Math.round(measure.width) + 2), 0 + Math.round(measure.fontBoundingBoxAscent / 2) - 2);
        this.ctx.fillText('0', -(Math.round(measure.width) + 2), 64 + (Math.round(measure.fontBoundingBoxAscent / 2) - 2));
        measure = this.ctx.measureText('-1');
        this.ctx.fillText('-1', -(Math.round(measure.width) + 2), 128 + (Math.round(measure.fontBoundingBoxAscent / 2) - 2));

        this.ctx.fillText('64', 130, 64 + (Math.round(measure.fontBoundingBoxAscent / 2) - 4));

        let last = fn(0, 0);
        const curve = new Path2D();
        curve.moveTo(0, (128 - (last * 128)) / 2);
        // const avg = [last];
        let mean = last;
        for (let i = 1; i < 64; i++) {
            // console.debug(i);
            const value = fn(i, i);
            // console.debug(`${i} / 64 = ${value.toFixed(2)}`);
            curve.lineTo(i * 2, (128 - (value * 128)) / 2);
            // avg.push(value);
            if (typeof value !== 'number' || Number.isNaN(value)) throw `wtf: ${value} for fn(${i}, ${i})`;
            mean += Math.abs(value);
            // ctx.fillRect(i * 2 - 2, (128 - (value * 128)) / 2 - 2, 4, 4);
        }
        mean /= 64;
        // console.debug("Mean graph:", mean);

        // const mean = avg.reduce((a, b) => Math.abs(a) + Math.abs(b), 0) / avg.length;
        if (this.opts.mean) {
            this.ctx.strokeStyle = '#aaaaaa80';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(0, 64 - Math.round((mean * 128) / 2) + 0.5);
            this.ctx.lineTo(128, 64 - Math.round((mean * 128) / 2) + 0.5);
            this.ctx.moveTo(0, 64 + Math.round((mean * 128) / 2) + 0.5);
            this.ctx.lineTo(128, 64 + Math.round((mean * 128) / 2) + 0.5);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        this.ctx.strokeStyle = props?.color ?? 'magenta';
        this.ctx.lineWidth = props?.thickness ?? 2;
        this.ctx.lineCap = "round";
        this.ctx.stroke(curve);

        if (this.opts.mean) {
            const avg_text = `ȳ=${mean.toFixed(4)}`;
            const measure = this.ctx.measureText(avg_text);
            const height = measure.fontBoundingBoxAscent + measure.fontBoundingBoxDescent;
            this.ctx.globalAlpha = 0.9;
            this.ctx.fillStyle = this.bg_color;
            this.ctx.fillRect(128-measure.width, 0, measure.width, height + 4);
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = 'grey';
            this.ctx.fillText(avg_text, 128-measure.width, measure.fontBoundingBoxAscent);

            this.ctx.strokeStyle = '#aaaaaa80';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(128-measure.width, Math.round(height) + 2.5);
            this.ctx.lineTo(128, Math.round(height) + 2.5);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        this.ctx.fillStyle = 'grey';
        if (props?.title !== undefined) {
            this.ctx.font = props?.title_font ?? 'italic 14pt serif';
            const name_measure = this.ctx.measureText(props.title);
            this.ctx.fillText(props.title, 64 - Math.round(name_measure.width / 2), -10 - Math.round(name_measure.fontBoundingBoxDescent));
        }

        this.ctx.restore();
    }
}

class DCT extends Waves {
    /** @type {{mean:boolean;solve:boolean;readonly:boolean;src?:string;}} */
    opts = {
        mean: true,
        solve: false,
        readonly: false,
        src: undefined,
    };

    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        super(canvas);
        this.opts.src = canvas.dataset.src;
        if (this.opts.src !== undefined) {
            fetch(this.opts.src).then(r => r.json().then(v => {
                    this.src = v;
                    for (let i = 0; i < 64; i++) {
                        const sum = [];
                        for (let n = 0; n < 64; n++) {
                            sum.push(
                            this.input_fn(n) *
                                Math.cos(
                                (Math.PI / 64) * (n + 0.5) * i
                                )
                            );
                        }
                        const scale =
                            i === 0
                            ? 1 / Math.sqrt(64)
                            : Math.sqrt(2 / 64);
                        const value =
                            scale * sum.reduce((a, b) => a + b);
                        console.log(value);
                        this.terms[i] = value * 100;
                    }
                    this.redraw();
                }));
        }
    }

    setup() {
        const terms = Number(this.canvas.dataset.terms ?? '1');
        this.show_terms = terms;
        const total_width = 440 + this.show_terms * 20;
        this.offset = (this.width - total_width) / 2;
        this.ctx.translate(this.offset, 0);

        for (let i = 0; i < terms; i++) {
            let term = Math.round((Math.random() * 2 - 1) * 100);
            while (term < 0.1 && term > -0.1) term = Math.random();
            const solve_term = this.opts.solve ? term : (Math.round((Math.random() * 2 - 1  ) * 100));
            this.terms.push(solve_term);
            this.input_terms.push(term);
            this.term_fns.push(x => Math.cos((Math.PI/64) * (x + 0.5) * i));

            if (this.opts.readonly) continue;

            const input = document.createElement('input');
            input.type = 'range';
            input.max = '800';
            input.min = '-800';
            input.value = String(solve_term);
            input.style.writingMode = 'vertical-lr';
            input.style.direction = 'rtl';
            input.style.appearance = 'slider-vertical';
            input.style.position = 'absolute';
            input.style.margin = '0';
            input.style.width = '16px';
            input.style.left = `${(188 + (i * 20) + 20) + this.offset}px`;
            input.style.top = '75px';
            input.style.height = '128px';

            input.oninput = e => {
                this.terms[i] = Number(input.value);
                this.redraw_term(i);
            };

            this.inputs.push(input);

            this.canvas.parentElement?.appendChild(input);
        }

        if (true) {
            // const button = document.createElement('button');
            // button.innerText = '🪄'
            // button.style.position = 'absolute';
            // button.style.margin = '0';
            // // button.style.width = '128px';
            // button.style.top = '250px';
            // button.style.background = 'none';
            // button.style.border = 'none';
            // button.style.padding = '0';
            // button.style.cursor = 'pointer';

            // this.canvas.parentElement?.appendChild(button);
            // button.style.left = `${(200 * (i + 1) + 84) + this.offset - (button.getBoundingClientRect().width / 2)}px`;

            // button.onclick = e => {
            //     const sum = [];
            //     for (let n = 0; n < 64; n++) {
            //         sum.push(this.input_fn(n) * Math.cos(Math.PI / 64 * (n + 0.5) * i));
            //     }
            //     const scale = i === 0 ? 1 / Math.sqrt(64) : Math.sqrt(2/64);
            //     const value = scale * sum.reduce((a, b) => a + b);
            //     console.log(value);
            //     this.terms[i] = (value * 100);
            //     this.redraw_term(i);
            // };
        }

        const input_terms = Number(this.canvas.dataset.inputTerms ?? terms);
        for (let i = terms; i < input_terms; i++) {
            let term = Math.round((Math.random() * 2 - 1) * 100);
            while (term < 0.1 && term > -0.1) term = Math.round((Math.random() * 2 - 1) * 100);
            this.input_terms.push(term);
            this.term_fns.push(x => Math.cos((Math.PI/64) *(x+0.5)* i));
        }
        for (let i = terms; i < 64; i++) {
            this.terms.push(0);
        }

        console.debug('Terms:', this.input_terms);
    }

    /**
     * @param {number} i
     */
    redraw_term(i) {
        this.ctx.fillStyle = this.bg_color;
        this.ctx.fillRect(200 * (i + 1) + 10, 0, 148, this.height);
        this.ctx.fillRect(200 * (this.show_terms + 1) + 10, 0, 148, this.height);
        this.draw_graph([200 * (i + 1) + 20, 75], x => this.term_fns[i](x) * (this.terms[i] / 100), {title: `cos(${i==0?'':i+1}𝑥)⋅(θ=${this.terms[i]/100})`, color: COLORS[i]});
        this.ctx.fillStyle = 'grey';
        // this.ctx.font = '11pt sans-serif';
        // const value_text = `θ = ${(this.terms[i] / 100).toFixed(2)}`;
        // const measure = this.ctx.measureText(value_text);
        // this.ctx.fillText(value_text, 200 * (i + 1) + 84 - Math.round(measure.width / 2), 128+75+5+Math.round(measure.actualBoundingBoxAscent));

		const correct = this.terms.length == this.input_terms.length && this.terms.every((value, index) => value === this.input_terms[index]);
        this.draw_graph(
            [200 * (this.show_terms + 1) + 20, 75],
            k => {
                const sum = [];
                for (let n = 1; n < 64; n++) {
                    const xn = n >= this.terms.length ? 0 : (this.terms[n] / 100);
                    sum.push(xn*Math.cos(Math.PI/64*(k + 0.5)*n))
                }
                const sum_result = sum.reduce((a,b)=>a+b);
                return (((this.terms[0]/100)/Math.sqrt(2)) + sum_result) * Math.sqrt(2/64);
                // return this.terms.map((t, i) => this.term_fns[i](x) * (t / 100)).reduce((p, n) => p - n, this.input_fn(x))
            },
            {
                title: 'Output',
                color: correct ? 'green' : 'red',
                title_font: 'bold 12pt sans-serif',
                thickness: 4,
        });
    }

    redraw() {
        this.ctx.fillStyle = this.bg_color;
        this.ctx.fillRect(-this.offset, 0, this.width, this.height);

        this.draw_graph([20, 75], (x) => this.input_fn(x), {
            title: 'Input',
            color: 'white',
            title_font: 'bold 12pt sans-serif',
            thickness: 4,
        });

        // for (let i = 0; i < this.show_terms; i++) {
        //     this.ctx.save();
        //     this.ctx.beginPath();
        //     this.ctx.moveTo(200 * (i + 1) - 3, 75 + 64);
        //     this.ctx.lineTo(200 * (i + 1) - 33, 75 + 64);
        //     this.ctx.lineCap = 'round';
        //     this.ctx.lineWidth = 5;
        //     this.ctx.strokeStyle = 'grey';
        //     this.ctx.stroke();
        //     this.ctx.restore();

        //     this.draw_graph([200 * (i + 1) + 20, 75], x => this.term_fns[i](x) * (this.terms[i] / 100), {
        //         title: `cos(π\u204464(𝑥+½)${i==0?'':i+1})`,
        //         color: COLORS[i]
        //     });

        //     // this.ctx.fillStyle = 'grey';
        //     // this.ctx.font = '11pt sans-serif';
        //     // const value_text = `θ = ${this.terms[i].toFixed(2)}`;
        //     // const measure = this.ctx.measureText(value_text);
        //     // this.ctx.fillText(value_text, 200 * (i + 1) + 84 - Math.round(measure.width / 2), 128+75+5+Math.round(measure.actualBoundingBoxAscent));
        // }

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(200 * (this.show_terms + 1) - 3, 75 + 54);
        this.ctx.lineTo(200 * (this.show_terms + 1) - 33, 75 + 54);
        this.ctx.moveTo(200 * (this.show_terms + 1) - 3, 75 + 74);
        this.ctx.lineTo(200 * (this.show_terms + 1) - 33, 75 + 74);
        this.ctx.lineCap = 'round';
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = 'grey';
        this.ctx.stroke();
        this.ctx.restore();

        const correct = this.terms.length == this.input_terms.length && this.terms.every((value, index) => value === this.input_terms[index]);
        this.draw_graph(
            [200 * (this.show_terms + 1) + 20, 75],
            k => {
                const sum = [];
                for (let n = 1; n < 64; n++) {
                    const xn = this.terms[n]/100;
                    sum.push(xn*Math.cos(Math.PI/64*(k + 0.5)*n))
                }
                const sum_result = sum.reduce((a,b)=>a+b);
                const x0 = this.terms[0]/100;
                return ((x0/Math.sqrt(2)) + sum_result) * Math.sqrt(2/64);
                // return this.terms.map((t, i) => this.term_fns[i](x) * (t / 100)).reduce((p, n) => p - n, this.input_fn(x))
            },
            {
                title: 'Output',
                color: correct ? 'green' : 'red',
                title_font: 'bold 12pt sans-serif',
                thickness: 4,
        });
    }

    /**
     *
     * @param {number} x
     * @param {number} [y]
     * @returns
     */
    input_fn(x) {
        if (this.src !== undefined)
            return this.src[x];
        let ret = 0;
        for (let i = 0; i < this.input_terms.length; i++)
            ret += this.term_fns[i](x) * (this.input_terms[i] / 100);

        return ret;
    };

    /**
     * @param {[number, number]} pos
     * @param {(x: number, i?: number) => number} fn
     * @param {{title?:string;color?:string;title_font?:string;thickness?:number;}} [props]
     */
    draw_graph(pos, fn, props) {
        this.ctx.save();

        this.ctx.translate(...pos);

        // this.ctx.strokeStyle = '#ddd';
        // this.ctx.strokeRect(0, 0, 128, 128);

        this.ctx.beginPath();
        this.ctx.moveTo(0, 64.5);
        this.ctx.lineTo(128, 64.5);

        this.ctx.moveTo(0.5, 0);
        this.ctx.lineTo(0.5, 128);
        this.ctx.strokeStyle = '#666';
        this.ctx.stroke();

        this.ctx.fillStyle = 'grey';
        this.ctx.font = '10pt serif';
        let measure = this.ctx.measureText('0');
        this.ctx.fillText('1', -(Math.round(measure.width) + 2), 0 + Math.round(measure.fontBoundingBoxAscent / 2) - 2);
        this.ctx.fillText('0', -(Math.round(measure.width) + 2), 64 + (Math.round(measure.fontBoundingBoxAscent / 2) - 2));
        measure = this.ctx.measureText('-1');
        this.ctx.fillText('-1', -(Math.round(measure.width) + 2), 128 + (Math.round(measure.fontBoundingBoxAscent / 2) - 2));

        this.ctx.fillText('64', 130, 64 + (Math.round(measure.fontBoundingBoxAscent / 2) - 4));

        let last = fn(0, 0);
        const curve = new Path2D();
        curve.moveTo(0, (128 - (last * 128)) / 2);
        // const avg = [last];
        let mean = last;
        for (let i = 1; i < 64; i++) {
            // console.debug(i);
            const value = fn(i, i);
            // console.debug(`${i} / 64 = ${value.toFixed(2)}`);
            curve.lineTo(i * 2, (128 - (value * 128)) / 2);
            // avg.push(value);
            if (typeof value !== 'number' || Number.isNaN(value)) throw `wtf: ${value} for fn(${i}, ${i})`;
            mean += Math.abs(value);
            // ctx.fillRect(i * 2 - 2, (128 - (value * 128)) / 2 - 2, 4, 4);
        }
        mean /= 64;
        // console.debug("Mean graph:", mean);

        // const mean = avg.reduce((a, b) => Math.abs(a) + Math.abs(b), 0) / avg.length;
        if (this.opts.mean) {
            this.ctx.strokeStyle = '#aaaaaa80';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(0, 64 - Math.round((mean * 128) / 2) + 0.5);
            this.ctx.lineTo(128, 64 - Math.round((mean * 128) / 2) + 0.5);
            this.ctx.moveTo(0, 64 + Math.round((mean * 128) / 2) + 0.5);
            this.ctx.lineTo(128, 64 + Math.round((mean * 128) / 2) + 0.5);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        this.ctx.strokeStyle = props?.color ?? 'magenta';
        this.ctx.lineWidth = props?.thickness ?? 2;
        this.ctx.lineCap = "round";
        this.ctx.stroke(curve);

        if (this.opts.mean) {
            const avg_text = `ȳ=${mean.toFixed(4)}`;
            const measure = this.ctx.measureText(avg_text);
            const height = measure.fontBoundingBoxAscent + measure.fontBoundingBoxDescent;
            this.ctx.globalAlpha = 0.9;
            this.ctx.fillStyle = this.bg_color;
            this.ctx.fillRect(128-measure.width, 0, measure.width, height + 4);
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = 'grey';
            this.ctx.fillText(avg_text, 128-measure.width, measure.fontBoundingBoxAscent);

            this.ctx.strokeStyle = '#aaaaaa80';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(128-measure.width, Math.round(height) + 2.5);
            this.ctx.lineTo(128, Math.round(height) + 2.5);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        this.ctx.fillStyle = 'grey';
        if (props?.title !== undefined) {
            this.ctx.font = props?.title_font ?? 'italic 14pt serif';
            const name_measure = this.ctx.measureText(props.title);
            this.ctx.fillText(props.title, 64 - Math.round(name_measure.width / 2), -10 - Math.round(name_measure.fontBoundingBoxDescent));
        }

        this.ctx.restore();
    }
}

document.querySelectorAll("div.post-content canvas").forEach(canvas => {
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const clazz = canvas.dataset.class ?? 'Waves';
    switch (clazz) {
        case 'Waves':
            new Waves(canvas);
            break;

        case 'DCT':
            new DCT(canvas);
            break;

        default: throw `Unknown class: ${clazz}.`;
    }
});
