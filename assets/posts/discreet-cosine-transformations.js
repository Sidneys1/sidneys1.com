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

class Cos {
    /** @type {HTMLCanvasElement} */
    canvas;
    /** @type {CanvasRenderingContext2D} */
    ctx;
    /** @type {number} */
    width;
    /** @type {number} */
    height;

    /** @type {string} */
    bg_color;

    /** @type {number} */
    offset;

    /** @type {number} */
    show_terms;

    /** @type {((x: number) => number)[]} */
    term_fns = [];

    /** @type {number} */
    points = 128;

    /**
     * @param {HTMLCanvasElement} canvas
      */
    constructor(canvas) {
        this.canvas = canvas;

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

        this.show_terms = Number(canvas.dataset.terms ?? '1');
    }

    setup() {
        const total_width = this.show_terms * 200;
        this.offset = (this.width - total_width) / 2;
        this.ctx.translate(this.offset, 0);

        for (let i = 0; i < this.show_terms; i++)
            this.term_fns.push(x => Math.cos(Math.PI*(i+1)*x))

        this.redraw();
    }

    redraw() {
        this.ctx.fillStyle = this.bg_color;
        this.ctx.fillRect(-this.offset, 0, this.width, this.height);

        for (let i = 0; i < this.show_terms; i++) {
            this.draw_graph(
                [200 * i + 20, 35],
                this.term_fns[i], {
                title: `cos(${i+1}𝑥)`,
                color: COLORS[i]
            });
        }
    }

    /**
     * @param {[number, number]} pos
     * @param {(x: number, i?: number) => number} fn
     * @param {{title?:string;color?:string;title_font?:string;thickness?:number;mean?:boolean}} [props]
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
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = '#666';
        this.ctx.stroke();

        this.ctx.fillStyle = 'grey';
        this.ctx.font = '10pt serif';
        let measure = this.ctx.measureText('0');
        this.ctx.fillText('1', -(Math.round(measure.width) + 2), 0 + Math.round(measure.fontBoundingBoxAscent / 2) - 2);
        this.ctx.fillText('0', -(Math.round(measure.width) + 2), 64 + (Math.round(measure.fontBoundingBoxAscent / 2) - 2));
        measure = this.ctx.measureText('-1');
        this.ctx.fillText('-1', -(Math.round(measure.width) + 2), 128 + (Math.round(measure.fontBoundingBoxAscent / 2) - 2));

        this.ctx.fillText('π', 130, 64 + (Math.round(measure.fontBoundingBoxAscent / 2) - 4));

        let last = fn(0, 0);
        const curve = new Path2D();
        curve.moveTo(0, (128 - (last * 128)) / 2);
        // const avg = [last];
        let mean = last;
        const step = 128 / this.points;
        for (let i = 1; i < this.points; i++) {
            const value = fn(i/this.points);
            curve.lineTo(i * step, (128 - (value * 128)) / 2);
            if (typeof value !== 'number' || Number.isNaN(value)) throw `wtf: ${value} for fn(${i}, ${i})`;
            mean += Math.abs(value);
        }
        mean /= 64;

        if (props?.mean) {
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

        if (props?.mean) {
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
            this.ctx.font = props?.title_font ?? '14pt serif';
            const name_measure = this.ctx.measureText(props.title);
            this.ctx.fillText(props.title, 64 - Math.round(name_measure.width / 2), -10 - Math.round(name_measure.fontBoundingBoxDescent));
        }

        this.ctx.restore();
    }
}

class CosAdd extends Cos {
    /** @type {{k_start: number; k_step: number; random_terms: boolean;}} */
    params = {
        k_start: 1,
        k_step: 1,
        random_terms: false,
    };

    /** @type {number[]} */
    terms = [];

    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        super(canvas);

        console.debug(canvas.dataset)
        this.params.k_start = Number(canvas.dataset.kStart ?? '1');
        this.params.k_step = Number(canvas.dataset.kStep ?? '1');
        this.params.random_terms = canvas.dataset.randomTerms === 'true';
    }

    setup() {
        const total_width = (this.show_terms + 1) * 200;
        this.offset = (this.width - total_width) / 2;
        this.ctx.translate(this.offset, 0);

        for (let i = 0; i < this.show_terms; i++) {
            this.terms.push(this.params.random_terms ? (Math.random() * 2) - 1 : (1/this.show_terms));
            // console.debug(`k-start=${this.params.k_start}; k-step=${this.params.k_step}; this=k-start:${this.params.k_start}+(i:${i}*k-step:${this.params.k_step})=${this.params.k_start+i*this.params.k_step}`);
            this.term_fns.push(x => Math.cos(Math.PI*(this.params.k_start+i*this.params.k_step)*x)*this.terms[i]);
        }

        this.redraw();
    }

    redraw() {
        this.ctx.fillStyle = this.bg_color;
        this.ctx.fillRect(-this.offset, 0, this.width, this.height);

        for (let i = 0; i < this.show_terms; i++) {
            if (i !== 0) {
                this.ctx.beginPath();
                this.ctx.moveTo(200 * i - 3, 35 + 64);
                this.ctx.lineTo(200 * i - 33, 35 + 64);
                this.ctx.moveTo(200 * i - 18, 35 + 64 - 15);
                this.ctx.lineTo(200 * i - 18, 35 + 64 + 15);
                this.ctx.lineCap = 'round';
                this.ctx.lineWidth = 3;
                this.ctx.strokeStyle = 'grey';
                this.ctx.stroke();
            }

            this.draw_graph(
                [200 * i + 20, 35],
                this.term_fns[i],
                {
                    title: this.params.random_terms ? `cos(${this.params.k_start+i*this.params.k_step}𝑥)⋅${this.terms[i].toFixed(2)}` : `cos(${this.params.k_start+i*this.params.k_step}𝑥)`,
                    color: COLORS[i]
                }
            );
        }

        this.ctx.beginPath();
        this.ctx.moveTo(200 * this.show_terms - 3, 35 + 54);
        this.ctx.lineTo(200 * this.show_terms - 33, 35 + 54);
        this.ctx.moveTo(200 * this.show_terms - 3, 35 + 74);
        this.ctx.lineTo(200 * this.show_terms - 33, 35 + 74);
        this.ctx.lineCap = 'round';
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = 'grey';
        this.ctx.stroke();

        this.draw_graph(
            [200 * this.show_terms + 20, 35],
            x => this.term_fns.map(f => f(x)).reduce((a, b) => a + b),
            {
                title: 'Output',
                color: 'green',
                title_font: 'bold 12pt sans-serif',
                thickness: 4,
        });
    }
}

class Waves extends Cos {
    terms = [];
    /** @type {number[]} */
    input_terms = [];

    /** @type {{mean:boolean;solve:boolean;readonly:boolean;}} */
    opts = {
        mean: true,
        solve: false,
        readonly: false,
    };

    /** @type {HTMLInputElement[]} */
    inputs = [];

    /**
     * @param {HTMLCanvasElement} canvas
      */
    constructor(canvas) {
        super(canvas);

        this.opts.mean = canvas.dataset.mean !== 'false';
        this.opts.solve = canvas.dataset.solve === 'true';
        this.opts.readonly = canvas.dataset.readonly === 'true';

        console.debug('Opts:', this.opts);
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
            this.term_fns.push(x => Math.cos(Math.PI * x * i));

            if (this.opts.readonly) continue;

            const input = document.createElement('input');
            input.type = 'range';
            input.max = '100';
            input.min = '-100';
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
            this.term_fns.push(x => Math.cos(Math.PI *x* i));
        }
        // for (let i = terms; i < 64; i++) {
        //     this.terms.push(0);
        // }

        console.debug('Terms:', this.input_terms);

        this.redraw();
    }

    /**
     *
     * @param {number} x
     * @returns
     */
    input_fn(x) {
        let ret = 0;
        for (let i = 0; i < this.input_terms.length; i++)
            ret += this.term_fns[i](x) * (this.input_terms[i] / 100);

        return ret;
    };

    /**
     * @param {number} i
     */
    redraw_term(i) {
        this.ctx.fillStyle = this.bg_color;
        this.ctx.fillRect(200 * (i + 1) + 10, 0, 148, this.height);
        this.ctx.fillRect(200 * (this.show_terms + 1) + 10, 0, 148, this.height);
        this.draw_graph([200 * (i + 1) + 20, 75], x => this.term_fns[i](x) * (this.terms[i] / 100), {
            title: i === 0 ? `cos(0)⋅${this.terms[i]/100}` : `cos(${i}𝑥)⋅${this.terms[i]/100}`,
            color: COLORS[i],
            mean: this.opts.mean,
        });

        this.ctx.fillStyle = 'grey';
        // this.ctx.font = '11pt sans-serif';
        // const value_text = `θ = ${(this.terms[i] / 100).toFixed(2)}`;
        // const measure = this.ctx.measureText(value_text);
        // this.ctx.fillText(value_text, 200 * (i + 1) + 84 - Math.round(measure.width / 2), 128+75+5+Math.round(measure.actualBoundingBoxAscent));

        const correct = this.terms.length == this.input_terms.length && this.terms.every((value, index) => value === this.input_terms[index]);
        this.draw_graph(
            [200 * (this.show_terms + 1) + 20, 75],
            x => this.input_fn(x) - this.terms.map((t, i) => this.term_fns[i](x) * t / 100).reduce((a, b) => a + b),
            {
                title: 'Output',
                color: correct ? 'green' : 'red',
                title_font: 'bold 12pt sans-serif',
                thickness: 4,
                mean: this.opts.mean,
        });
    }

    redraw() {
        this.ctx.fillStyle = this.bg_color;
        this.ctx.fillRect(-this.offset, 0, this.width, this.height);

        this.draw_graph(
            [20, 75],
            x => this.input_fn(x),
            {
                title: 'Input',
                color: 'green',
                title_font: 'bold 12pt sans-serif',
                thickness: 4,
                mean: this.opts.mean,
            }
        );

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

            this.draw_graph([200 * (i + 1) + 20, 75], x => this.term_fns[i](x) * (this.terms[i] / 100), {
                title: i === 0 ? `cos(0)⋅${this.terms[i]/100}` : `cos(${i}𝑥)⋅${this.terms[i]/100}`,
                color: COLORS[i],
                mean: this.opts.mean,
            });

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
            x => this.input_fn(x) - this.terms.map((t, i) => this.term_fns[i](x) * t / 100).reduce((a, b) => a + b),
            {
                title: 'Output',
                color: correct ? 'green' : 'red',
                title_font: 'bold 12pt sans-serif',
                thickness: 4,
                mean: this.opts.mean,
        });
    }
}

const SLIDER_WIDTH = 16;
class DCT extends Waves {
    /** @type {number[]} */
    src = [];

    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        super(canvas);
        const src = canvas.dataset.src;
        if (src === undefined) throw "Requires src!"
        this.ctx.fillStyle = this.bg_color;
        this.ctx.fillRect(-this.offset, 0, this.width, this.height);
        fetch(src).then(r => r.json().then(v => this.handle_src(v)));
    }

    handle_src(v) {
        this.src = v;
        for (let i = 0; i < 32; i++) {
            const sum = [];
            for (let n = 0; n < 32; n++) {
                sum.push(
                this.src[n] *
                    Math.cos(
                    (Math.PI / 32) * (n + 0.5) * i
                    )
                );
            }
            const scale =
                i === 0
                ? 1 / Math.sqrt(32)
                : Math.sqrt(2 / 32);
            const value =
                scale * sum.reduce((a, b) => a + b);
            this.terms[i] = value;
            this.inputs[i].value = String(this.terms[i]);
        }
        console.debug("Terms after solve:", this.terms);
        this.redraw();
    }

    setup() {
        const terms = 32;
        this.show_terms = terms;
        const total_width = 400 + this.show_terms * (SLIDER_WIDTH + 8);
        this.offset = (this.width - total_width) / 2;
        this.ctx.translate(this.offset, 0);

        for (let i = 0; i < terms; i++) {
            this.terms.push(0);
            this.term_fns.push(x => Math.cos((Math.PI/32) * (x + 0.5) * i));

            if (this.opts.readonly) continue;

            const input = document.createElement('input');
            input.type = 'number';
            input.max = '8';
            input.min = '-8';
            input.value = '0';
            input.style.writingMode = 'vertical-lr';
            input.style.direction = 'rtl';
            input.step = 'any';
            // input.style.appearance = 'slider-vertical';
            input.style.position = 'absolute';
            input.style.margin = '0';
            input.style.width = `${SLIDER_WIDTH}px`;
            input.style.left = `${(188 + (i * (SLIDER_WIDTH + 8))) + this.offset}px`;
            input.style.top = '39px';
            input.style.height = '200px';

            input.oninput = e => {
                this.terms[i] = Number(input.value);
                this.redraw_term(i);
            };

            this.inputs.push(input);

            this.canvas.parentElement?.appendChild(input);
        }
    }

    output_fn(k) {
        const sum = [];
        for (let n = 1; n < 32; n++) {
            const xn = this.terms[n];
            sum.push(xn*Math.cos(Math.PI/32*(k + 0.5)*n))
        }
        const sum_result = sum.reduce((a,b)=>a+b);
        const x0 = this.terms[0];
        return ((x0/Math.sqrt(2)) + sum_result) * Math.sqrt(2/32);
    }

    /**
     * @param {number} i
     */
    redraw_term(i) {
        this.ctx.fillStyle = this.bg_color;
        this.ctx.fillRect(220 + this.show_terms * (SLIDER_WIDTH + 8), 0, 148, this.height);

        let correct = true;
        for (let i = 0; i < 32; i++) {
            if (this.src[i] !== this.output_fn(i)) {
                correct = false;
                break;
            }
        }
        this.draw_graph(
            [220 + this.show_terms * (SLIDER_WIDTH + 8), 75],
            x => this.output_fn(x),
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

        this.draw_graph([20, 75], (x) => this.src[x], {
            title: 'Input',
            color: 'green',
            title_font: 'bold 12pt sans-serif',
            thickness: 4,
        });

        let correct = true;
        for (let i = 0; i < 32; i++) {
            if (this.src[i] === this.output_fn(i)) {
                correct = false;
                break;
            }
        }
        this.draw_graph(
            [220 + this.show_terms * (SLIDER_WIDTH + 8), 75],
            x => this.output_fn(x),
            {
                title: 'Output',
                color: correct ? 'green' : 'red',
                title_font: 'bold 12pt sans-serif',
                thickness: 4,
        });
    }

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

        this.ctx.fillText('32', 130, 64 + (Math.round(measure.fontBoundingBoxAscent / 2) - 4));

        let last = fn(0, 0);
        const curve = new Path2D();
        curve.moveTo(0, (128 - (last * 128)) / 2);
        // const avg = [last];
        let mean = last;
        for (let i = 1; i < 32; i++) {
            // console.debug(i);
            const value = fn(i, i);
            // console.debug(`${i} / 64 = ${value.toFixed(2)}`);
            curve.lineTo(i * 4, (128 - (value * 128)) / 2);
            // avg.push(value);
            if (typeof value !== 'number' || Number.isNaN(value)) throw `wtf: ${value} for fn(${i}, ${i})`;
            mean += Math.abs(value);
            // ctx.fillRect(i * 2 - 2, (128 - (value * 128)) / 2 - 2, 4, 4);
        }
        mean /= 32;
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

class Quant extends DCT {
    /** @type {number[]} */
    quant = [];

    handle_src(v) {
        this.src = v;
        console.log(this.src.length);
        // this.src.splice(0, 128-64);
        for (let i = 0; i < 128; i++) {
            const sum = [];
            for (let n = 0; n < 128; n++) {
                sum.push(
                this.src[n] *
                    Math.cos(
                    (Math.PI / 128) * (n + 0.5) * i
                    )
                );
            }
            const scale =
                i === 0
                ? 1 / Math.sqrt(128)
                : Math.sqrt(2 / 128);
            const value =
                scale * sum.reduce((a, b) => a + b);
            this.terms[i] = value;
        }
        console.debug("Terms after solve:", this.terms);
        this.redraw();
    }

    setup() {
        const terms = 128;
        this.show_terms = terms;
        const total_width = 400 + 32 * (SLIDER_WIDTH + 8);
        this.offset = (this.width - total_width) / 2;
        this.ctx.translate(this.offset, 0);

        for (let i = 0; i < terms; i++) {
            this.terms.push(0);
            this.quant.push(1);
            this.term_fns.push(x => Math.cos((Math.PI/128) * (x + 0.5) * i));

            if (this.opts.readonly) continue;

            if (i >= 32) continue;

            const input = document.createElement('input');
            input.type = 'number';
            input.max = '1000';
            input.min = '1';
            input.value = '1';
            input.style.writingMode = 'vertical-lr';
            input.style.direction = 'rtl';
            input.step = 'any';
            // input.style.appearance = 'slider-vertical';
            input.style.position = 'absolute';
            input.style.margin = '0';
            input.style.width = `${SLIDER_WIDTH}px`;
            input.style.left = `${(188 + (i * (SLIDER_WIDTH + 8))) + this.offset}px`;
            // input.style.top = '39px';
            input.style.top = '0';
            input.style.height = '100px';

            input.oninput = e => {
                this.quant[i] = Number(input.value);
                this.redraw_term(i);
            };

            this.inputs.push(input);

            this.canvas.parentElement?.appendChild(input);
        }
    }

    output_fn(k) {
        const sum = [];
        for (let n = 1; n < 128; n++) {
            const xn = Math.round(this.terms[n] * 128 / this.quant[n]) * this.quant[n] / 128;
            sum.push(xn*Math.cos(Math.PI/128*(k + 0.5)*n))
        }
        const sum_result = sum.reduce((a,b)=>a+b);
        const x0 = Math.round(this.terms[0] * 128 / this.quant[0]) * this.quant[0] / 128;
        return ((x0/Math.sqrt(2)) + sum_result) * Math.sqrt(2/128);
    }

    /**
     * @param {number} i
     */
    redraw_term(i) {
        this.ctx.fillStyle = this.bg_color;
        this.ctx.fillRect(216 + 32 * (SLIDER_WIDTH + 8), 0, 156, this.height);
        this.ctx.fillRect(188 + (i * (SLIDER_WIDTH + 8)), 64 + 75 + 8 + (24 * (i % 3)) - 39, (SLIDER_WIDTH + 8) * 3, 25);

        this.ctx.fillStyle = 'grey';
        this.ctx.font = '10px sans-serif';
        this.ctx.fillText(`${(this.terms[i] * 128).toFixed(2)}`, (188 + (i * (SLIDER_WIDTH + 8))), 64 + 75 + 20 + (24 * (i % 3)) - 39);
        this.ctx.fillText(`${Math.round(this.terms[i] * 128 / this.quant[i]) * this.quant[i]}`, (188 + (i * (SLIDER_WIDTH + 8))), 64 + 75 + 20 + (24 * (i % 3)) + 12 - 39);

        // let error = 0;
        // for (let i = 0; i < 64; i++) {
        //     const diff = this.src[i] - this.output_fn(i);
        //     error += diff;
        // }
        // error /= 64;
        // console.debug(`Error: ${(error * 100).toFixed(4)}%`);
        this.draw_graph(
            [220 + 32 * (SLIDER_WIDTH + 8), 75],
            x => this.output_fn(x),
            {
                title: 'Output',
                title_font: 'bold 12pt sans-serif',
                thickness: 2,
                error: x => this.src[x],
        });
    }

    redraw() {
        this.ctx.fillStyle = this.bg_color;
        this.ctx.fillRect(-this.offset, 0, this.width, this.height);

        this.draw_graph([20, 75], (x) => this.src[x], {
            title: 'Input',
            color: 'green',
            title_font: 'bold 12pt sans-serif',
            thickness: 4,
        });

        this.ctx.fillStyle = 'grey';
        this.ctx.font = '10px sans-serif';
        for (let i = 0; i < 32; i++ ) {
            this.ctx.fillText(`${(this.terms[i] * 128).toFixed(2)}`, (188 + (i * (SLIDER_WIDTH + 8))), 64 + 75 + 20 + (24 * (i % 3)) - 39);
            this.ctx.fillText(`${Math.round(this.terms[i] * 128 / this.quant[i]) * this.quant[i]}`, (188 + (i * (SLIDER_WIDTH + 8))), 64 + 75 + 20 + (24 * (i % 3)) + 12 - 39);
        }

        // let error = 0;
        // for (let i = 0; i < 64; i++) {
        //     const diff = this.src[i] - this.output_fn(i);
        //     error += diff;
        // }
        // error /= 64;
        // console.debug(`Error: ${(error * 100).toFixed(4)}%`);
        this.draw_graph(
            [220 + 32 * (SLIDER_WIDTH + 8), 75],
            x => this.output_fn(x),
            {
                title: 'Output',
                title_font: 'bold 12pt sans-serif',
                thickness: 2,
                error: x => this.src[x],
        });
    }

    /**
     * @param {[number, number]} pos
     * @param {(x: number, i?: number) => number} fn
     * @param {{title?:string;color?:string;title_font?:string;thickness?:number;error?:(x:number)=>number}} [props]
     */
    draw_graph(pos, fn, props) {
        this.ctx.save();

        this.ctx.translate(...pos);

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

        this.ctx.fillText('128', 130, 64 + (Math.round(measure.fontBoundingBoxAscent / 2) - 4));

        let last = fn(0);
        const curve = new Path2D();
        const error = new Path2D();
        let error_acc = 0;
        curve.moveTo(0, (128 - (last * 128)) / 2);
        if (props?.error !== undefined) {
            const i_val = props.error(0);
            error.moveTo(0, (128 - (i_val * 128)) / 2);
            error_acc = i_val;
        }
        for (let i = 1; i < 128; i++) {
            const value = fn(i);
            curve.lineTo(i, (128 - (value * 128)) / 2);
            if (props?.error !== undefined) {
                const i_val = props.error(i);
                error.lineTo(i, (128 - (i_val * 128)) / 2);
                error_acc += Math.abs(i_val - value);
            }
            if (typeof value !== 'number' || Number.isNaN(value)) throw `wtf: ${value} for fn(${i}, ${i})`;
        }
        error_acc /= 128;
        // console.debug("Mean graph:", mean);

        if (props?.error !== undefined) {
            this.ctx.strokeStyle = 'green';
            this.ctx.lineWidth = 1;
            this.ctx.stroke(error);
        }

        this.ctx.strokeStyle = props?.color ?? (props?.error !== undefined ? 'red' : 'magenta');
        this.ctx.lineWidth = props?.thickness ?? 2;
        this.ctx.lineCap = "round";
        this.ctx.stroke(curve);

        if (props?.error !== undefined) {
            const err_text = `ε=${(error_acc * 100).toFixed(4)}%`;
            const measure = this.ctx.measureText(err_text);
            const height = measure.fontBoundingBoxAscent + measure.fontBoundingBoxDescent;
            this.ctx.globalAlpha = 0.9;
            this.ctx.fillStyle = this.bg_color;
            this.ctx.fillRect(128-measure.width, 128-height, measure.width, height);
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = 'grey';
            this.ctx.fillText(err_text, 128-measure.width, 128 + measure.fontBoundingBoxAscent);
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
        case 'Cos':
            new Cos(canvas).setup();
            break;

        case 'CosAdd':
            new CosAdd(canvas).setup();
            break;

        case 'Waves':
            new Waves(canvas).setup();
            break;

        case 'DCT':
            new DCT(canvas).setup();
            break;

        case 'Quant':
            new Quant(canvas).setup();
            break;

        default: throw `Unknown class: ${clazz}.`;
    }
});
