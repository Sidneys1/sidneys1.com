---
layout: post
title:  "HTML5 Canvas Tips"
categories: [programming, tips]
tags: [programming, html5, canvas, tips]
author: Sidneys1
image: /images/html5-canvas-tips/hero.png
image_shadow: false
toc: true
excerpt_separator: <!--more-->
---

The `<canvas>` element may be the best thing to happen to HTML since `<marquee>`. I've been
[using][merlin]{:target="_blank"} it [a lot][raina]{:target="_blank"} for [various projects][dcts]{:target="_blank"}
recently and thought it'd be nice to collect some of the tips and tricks I've learned into once place.

[merlin]: https://github.com/Sidneys1/Merlin
[raina]: https://github.com/Sidneys1/Raina
[dcts]: https://infosec.exchange/@Sidneys1/113562091539216937

<!--more-->

<style>
canvas {
	align-self: center;
	justify-self: center;
	margin-bottom: 15px;
}
canvas:not(.no-shadow) {
	box-shadow: 0 0 10px rgba(0,0,0,0.2);
}
.highlight-4 {
	text-shadow: 0 0 3px #00000080;
}
</style>

## Pixel Canvas

If you've used canvas at all you know that its `width="xxx"` and `height="xxx"` attributes define the dimensions of the
image the canvas represents, while you can use the `style="width: xxx; height: xxx;"` CSS properties to control the
size of the element on the page. If you're trying to create a pixelated-style game, you can use the CSS to scale up a
relatively small canvas:

<div style="display: grid; grid-template-columns: 1fr auto; gap: 1em;">

<div markdown="1" style="align-self: center;">

```html
<canvas id="pixelated-canvas"
        width="50" height="50"></canvas>
```

```css
canvas { width: 300px; height: 300px; }
```

```js
const ctx = document.getElementById('pixelated-canvas').getContext('2d');
ctx.fillStyle = 'grey';
ctx.fillRect(0, 0, 50, 50);
ctx.strokeStyle = 'black';
ctx.rect(5, 5, 40, 40);
ctx.stroke();
```

</div>

<canvas id="pixelated-canvas" width="50" height="50" style="width: 300px; height: 300px;"></canvas>
<script>
window.addEventListener('load', e => {
    const canvas = document.getElementById('pixelated-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) throw `Expected 'canvas', got '${canvas?.constructor.name}'`;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'grey';
    ctx.fillRect(0, 0, 50, 50);
    ctx.rect(5, 5, 40, 40);
    ctx.strokeStyle = 'black';
    ctx.stroke();
});
</script>

<div style="grid-column:1/3;" markdown="1">
Well, isn't that ugly! Thankfully we can fix it with the `image-rendering: pixelated` CSS property. Also note while
we're here that the stroke borders two pixels. That's because the point coordinates fall on the borders between pixels.
To overcome this, we'll also offset the coordinates by half a pixel.
</div>

<div markdown="1" style="align-self: center;">

<div class="language-css highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="nt">canvas</span> <span class="p">{</span> <span class="nl">width</span><span class="p">:</span> <span class="m">300px</span><span class="p">;</span> <span class="nl">height</span><span class="p">:</span> <span class="m">300px</span><span class="p">;</span>
         <span class="highlight-4"><span class="nl">image-rendering</span><span class="p">:</span> <span class="n">pixelated</span><span class="p">;</span></span> <span class="p">}</span>
</code></pre></div>    </div>

<div class="language-js highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1">// ...</span>
<span class="nx">ctx</span><span class="p">.</span><span class="nf">rect</span><span class="p">(</span><span class="mf">5<span class="highlight-4">.5</span></span><span class="p">,</span> <span class="mf">5<span class="highlight-4">.5</span></span><span class="p">,</span> <span class="mi">40</span><span class="p">,</span> <span class="mi">40</span><span class="p">);</span>
<span class="nx">ctx</span><span class="p">.</span><span class="nf">stroke</span><span class="p">();</span>
</code></pre></div>    </div>

</div>

<canvas id="pixelated-canvas-2" width="50" height="50" style="width: 300px; height: 300px; image-rendering: pixelated;"></canvas>
<script>
window.addEventListener('load', e => {
    const canvas = document.getElementById('pixelated-canvas-2');
    if (!(canvas instanceof HTMLCanvasElement)) throw 'bla';
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'grey';
    ctx.fillRect(0, 0, 50, 50);
    ctx.rect(5.5, 5.5, 40, 40);
    ctx.strokeStyle = 'black';
    ctx.stroke();
});
</script>

</div>

## HI-DPI Canvas

Because the canvas element has a specific size in pixels, it is not DPI-aware. That is, if your operating system or
browser zoom is set to anything other than 100%, the number of physical screen pixels that represent each CSS pixel may
not be in a 1-to-1 ratio.

<div style="display: grid; grid-template-columns: 1fr auto auto; gap: 1em;">

<div style="text-align: center; grid-column: 2/3;font-weight: bold;">Canvas</div><div style="text-align: center;font-weight: bold;">Zoomed 3x</div>

<div markdown="1" style="align-self: center;">

```js
// This is the current pixel ratio of device pixels to CSS pixels. For example,
// a value of `1.5` would indicate that for every CSS pixel, there are 1.5
// device pixels (a scaling ratio of 150%).
const ratio = window.devicePixelRatio || 1;
const canvas = document.getElementById('hidpi-canvas');
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'grey';
ctx.fillRect(0, 0, 200, 200);
ctx.moveTo(50.5, 105.5);
ctx.lineTo(150.5, 105.5);
ctx.strokeStyle = 'black';
ctx.stroke();
ctx.font = '20pt serif';
ctx.fillStyle = 'black';
ctx.fillText(`Ratio: ${(ratio*100).toFixed(0)}%`, 30, 100);
```

</div>

<canvas id="hidpi-canvas" width="200" height="200"></canvas>
<script>
window.addEventListener('load', e => {
    const ratio = window.devicePixelRatio || 1;
    const canvas = document.getElementById('hidpi-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) throw 'bla';
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'grey';
    ctx.fillRect(0, 0, 200, 200);
    ctx.moveTo(50.5, 105.5);
    ctx.lineTo(150.5, 105.5);
    ctx.strokeStyle = 'black';
    ctx.stroke();
    ctx.font = '20pt serif';
    ctx.fillStyle = 'black';
    const text = `Ratio: ${(ratio*100).toFixed(0)}%`;
    const size = ctx.measureText(text);
    ctx.fillText(text, 100-(size.width / 2), 100);
});
</script>

<img style="align-self: center; margin-bottom: 15px;" src="{{ '/images/html5-canvas-tips/bad-hi-dpi.png' | absolute_url }}">

<div style="grid-column: 1/4;" markdown="1">
Note how the text is blurry, and the line below it is as well, despite using our half a pixel offset trick from
[the previous section](#pixel-canvas) (if your ratio is 100%, just consult the screenshot)? Let's make some tweaks to
the canvas to work around this:
</div>

<div style="align-self: center;">
<div class="language-js highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1">// ...</span>
<span class="kd">const</span> <span class="nx">ratio</span> <span class="o">=</span> <span class="nb">window</span><span class="p">.</span><span class="nx">devicePixelRatio</span> <span class="o">||</span> <span class="mi">1</span><span class="p">;</span>
<span class="kd">const</span> <span class="nx">canvas</span> <span class="o">=</span> <span class="nb">document</span><span class="p">.</span><span class="nf">getElementById</span><span class="p">(</span><span class="dl">'</span><span class="s1">hidpi-canvas</span><span class="dl">'</span><span class="p">);</span>
<span class="highlight-4"><span class="nx">canvas</span><span class="p">.</span><span class="nx">style</span><span class="p">.</span><span class="nx">width</span> <span class="o">=</span> <span class="s2">`</span><span class="p">${</span><span class="nx">canvas</span><span class="p">.</span><span class="nx">width</span><span class="p">}</span><span class="s2">px`</span><span class="p">;</span>
<span class="nx">canvas</span><span class="p">.</span><span class="nx">style</span><span class="p">.</span><span class="nx">height</span> <span class="o">=</span> <span class="s2">`</span><span class="p">${</span><span class="nx">canvas</span><span class="p">.</span><span class="nx">height</span><span class="p">}</span><span class="s2">px`</span><span class="p">;</span>
<span class="nx">canvas</span><span class="p">.</span><span class="nx">width</span> <span class="o">*=</span> <span class="nx">ratio</span><span class="p">;</span>
<span class="nx">canvas</span><span class="p">.</span><span class="nx">height</span> <span class="o">*=</span> <span class="nx">ratio</span><span class="p">;</span></span>
<span class="kd">const</span> <span class="nx">ctx</span> <span class="o">=</span> <span class="nx">canvas</span><span class="p">.</span><span class="nf">getContext</span><span class="p">(</span><span class="dl">'</span><span class="s1">2d</span><span class="dl">'</span><span class="p">);</span>
<span class="highlight-4"><span class="nx">ctx</span><span class="p">.</span><span class="nf">scale</span><span class="p">(</span><span class="nx">ratio</span><span class="p">,</span> <span class="nx">ratio</span><span class="p">);</span></span>
<span class="c1">// ...</span></code></pre></div>    </div>
</div>

<canvas id="hidpi-canvas-2" width="200" height="200"></canvas>
<script>
window.addEventListener('load', e => {
    const ratio = window.devicePixelRatio || 1;
    const canvas = document.getElementById('hidpi-canvas-2');
    if (!(canvas instanceof HTMLCanvasElement)) throw 'bla';
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    canvas.width *= ratio;
    canvas.height *= ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.fillStyle = 'grey';
    ctx.fillRect(0, 0, 200, 200);
    ctx.moveTo(50.5, 105.5);
    ctx.lineTo(150.5, 105.5);
    ctx.strokeStyle = 'black';
    ctx.stroke();
    ctx.font = '20pt serif';
    ctx.fillStyle = 'black';
    const text = `Ratio: ${(ratio*100).toFixed(0)}%`;
    const size = ctx.measureText(text);
    ctx.fillText(text, 100-(size.width / 2), 100);
});
</script>

<img style="align-self: center; margin-bottom: 15px;" src="{{ '/images/html5-canvas-tips/good-hi-dpi.png' | absolute_url }}">

</div>

## ClearType Font Smoothing

Riding off our last example, let's make the text rendering *even smoother*. If the browser knows that canvas text will
be rendered against a set color, it will use [subpixel rendering][sr]{:target="_blank"} (aka ClearType). To do this, we
need to use an opaque canvas, created by passing some options to the canvas' `getContext` function.

[sr]: https://en.wikipedia.org/wiki/Subpixel_rendering

<div class="language-js highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="kd">const</span> <span class="nx">canvas</span> <span class="o">=</span> <span class="nb">document</span><span class="p">.</span><span class="nf">getElementById</span><span class="p">(</span><span class="dl">'</span><span class="s1">cleartype-canvas</span><span class="dl">'</span><span class="p">);</span>
<span class="kd">const</span> <span class="nx">ctx</span> <span class="o">=</span> <span class="nx">canvas</span><span class="p">.</span><span class="nf">getContext</span><span class="p">(</span><span class="dl">'</span><span class="s1">2d</span><span class="dl">'</span><span class="p">,</span> <span class="highlight-4"><span class="p">{</span><span class="na">alpha</span><span class="p">:</span> <span class="kc">false</span><span class="p">}</span></span><span class="p">);</span>
</code></pre></div></div>

<div style="display: grid; grid-template-columns: auto 1fr auto; gap: 0 1em;">

<div style="grid-column: 3; font-weight: bold;text-align: center;">Zoomed 4x</div>

<div style="align-self: center; font-style:italic; justify-self: end;">Browser-rendered text:</div>

<div id="hello-world" style="align-self: center; text-align: center;color: grey;">Hello, World!</div>

<img style="align-self: center; margin-bottom: 15px;" src="{{ '/images/html5-canvas-tips/browser-text.png' | absolute_url }}">

<div style="align-self: center;font-style:italic; justify-self: end;">Default canvas-rendered text (with HI-DPI fix):</div>
<canvas id="no-cleartype-canvas" class="no-shadow" width="200" height="50"></canvas>
<script>
window.addEventListener('load', e => {
    const helloWorld = document.getElementById('hello-world');
    if (!(helloWorld instanceof HTMLDivElement)) throw 'Expected div!';
    const font = window.getComputedStyle(helloWorld).font;
    const ratio = window.devicePixelRatio || 1;
    const canvas = document.getElementById('no-cleartype-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) throw 'bla';
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    canvas.width *= ratio;
    canvas.height *= ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.font = font;
    ctx.fillStyle = 'grey';
    const text = 'Hello, World!';
    const size = ctx.measureText(text);
    ctx.fillText(text, 100-(size.width / 2), 40);
});
</script>
<img style="align-self: center; margin-bottom: 15px;" src="{{ '/images/html5-canvas-tips/bad-canvas-text.png' | absolute_url }}">

<div style="align-self: center;font-style:italic; justify-self: end;">Canvas-rendered text with HI-DPI and ClearType fix:</div>
<canvas id="cleartype-canvas" class="no-shadow" width="200" height="50"></canvas>
<script>
function getBgColor(element) {
    if (element === undefined) throw "Reached end of tree...";
    const bg = window.getComputedStyle(element).background;
    if (bg === 'none') return getBgColor(element.parentElement);
    return [bg, element];
}
function redraw(ctx, bg) {
    const helloWorld = document.getElementById('hello-world');
    if (!(helloWorld instanceof HTMLDivElement)) throw 'Expected div!';
    const font = window.getComputedStyle(helloWorld).font;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 200, 50);
    ctx.font = font;
    ctx.fillStyle = 'grey';
    const text = 'Hello, World!';
    const size = ctx.measureText(text);
    ctx.fillText(text, 100-(size.width / 2), 40);
}
window.addEventListener('load', e => {
    const ratio = window.devicePixelRatio || 1;
    const canvas = document.getElementById('cleartype-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) throw 'bla';
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    canvas.width *= ratio;
    canvas.height *= ratio;
    const ctx = canvas.getContext('2d', {alpha: false});
	ctx.scale(ratio, ratio);
    const [bg, element] = getBgColor(canvas);
    element.addEventListener('change', e => {
        const [bg2, element] = getBgColor(canvas);
        redraw(ctx, bg2);
    });
    redraw(ctx, bg);
});
</script>

<img style="align-self: center; margin-bottom: 15px;" src="{{ '/images/html5-canvas-tips/good-canvas-text.png' | absolute_url }}">
</div>

## Matching Background Colors on an Opaque Canvas

When using an opaque canvas, the default fill color when initialized or when calling `ctx.clearRect(...)` is always
`#000`. If we want the canvas fill to match our page (assuming it's a solid color), we can get the color with this
simple function:

```js
/**
 * Returns the background color of the nearest ancestor that is not `none`.
 * @param {HTMLElement} element
 * @returns {string}
 */
function getBgColor(element) {
    if (element === undefined) throw "Reached end of tree...";
    const bg = window.getComputedStyle(element).background;
    if (bg !== 'none') return bg;
    return getBgColor(element.parentElement);
}

// ...later...
const bg =
ctx.fillStyle = getBgColor(canvas);
ctx.fillRect(0, 0, canvas.width, canvas.height);
```

If the background can change (e.g., when entering or leaving dark mode) you can subscribe to change events like so:

```js
/**
 * Returns the background color of the nearest ancestor that is not `none`.
 * @param {HTMLElement} element
 * @returns {[string, HTMLElement]}
 */
function getBgColor(element) {
    if (element === undefined) throw "Reached end of tree...";
    const bg = window.getComputedStyle(element).background;
	// Note that we've changed this to return the element as well as the color.
    if (bg !== 'none') return [bg, element];
    return getBgColor(element.parentElement);
}

// ...later...
function redraw(bg_color) {
    ctx.fillStyle = bg_color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // ...
}
const [bg, element] = getBgColor(canvas);
redraw(bg);
element.addEventListener('change', e => redraw(window.getComputedStyle(element).background));
```
