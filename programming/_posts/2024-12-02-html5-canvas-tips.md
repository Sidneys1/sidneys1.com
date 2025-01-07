---
layout: post
title:  "HTML5 Canvas Tips"
categories: [programming, tips]
tags: [programming, html5, canvas, tips]
author: Sidneys1
image: /images/html5-canvas-tips/hero.png
image_shadow: false
toc: true
mastodon_comment_url: https://infosec.exchange/@Sidneys1/113584748001153882
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

.grid-2 {
	display: grid;
	grid-template-columns: 1fr auto;
	gap: 1em;

	> div, > figure {
		align-self: center;
	}
}

.grid-3 {
	display: grid;
	grid-template-columns: 1fr auto auto;
	gap: 1em;

	> div, > figure {
		align-self: center;
	}
}

figcaption {
	font-weight: bold;
}

@media screen and (max-width: 1200px) {
	:is(.grid-2,.grid-2-even,.grid-3):not(.no-phone-layout) {
		display: block;
		> canvas, > figure > canvas {
			margin-left: auto;
			margin-right: auto;
			display: block;
		}
	}
}
</style>

## Pixel-Art Canvas

If you've used canvas at all you know that its `width="xxx"` and `height="xxx"` attributes define the dimensions of the
image the canvas represents, while you can use the `style="width: xxx; height: xxx;"` CSS properties to control the
size of the element on the page. If you're trying to create a pixelated-style game, you can use the CSS to scale up a
relatively small canvas:

<img id="favicon" src="{{ '/favicon.png' | absolute_url }}" style="display:none;" />
<div class="grid-2">
<div markdown="1">
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
ctx.drawImage(document.getElementById('favicon'), 13, 13, 24, 24);
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
			ctx.drawImage(document.getElementById('favicon'), 13, 13, 24, 24);
		});
	</script>
</div>

Well, isn't that ugly! Thankfully we can fix it with the `image-rendering: pixelated` CSS property. Also note while
we're here that the stroke seems to be two pixels wide, and semi-transparent. That's because the point coordinates fall
on the borders between pixels, and the line is being drawn as if it was halfway between them. To overcome this, we'll
need to offset the coordinates of the line by half a pixel. Maybe an illustration will help:

<div style="display: flex;flex-wrap:wrap;justify-content:center;">
	<img class="no-shadow" alt="An illustration of attempting to draw a line on a pixel grid." src="{{ '/images/html5-canvas-tips/grid-0-0.png' | absolute_url }}"/>
	<img class="no-shadow" alt="An illustration of attempting to draw a line on a pixel grid, offset by half a unit." src="{{ '/images/html5-canvas-tips/grid-05-05.png' | absolute_url }}"/>
</div>

So, let's apply these fixes:

<div class="grid-2">
	<div>
		<div class="language-css highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="nt">canvas</span> <span class="p">{</span> <span class="nl">width</span><span class="p">:</span> <span class="m">300px</span><span class="p">;</span> <span class="nl">height</span><span class="p">:</span> <span class="m">300px</span><span class="p">;</span>
         <span class="highlight-4"><span class="nl">image-rendering</span><span class="p">:</span> <span class="n">pixelated</span><span class="p">;</span></span> <span class="p">}</span></code></pre></div>
		</div>
		<div class="language-js highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1">// ...</span>
<span class="nx">ctx</span><span class="p">.</span><span class="nf">rect</span><span class="p">(</span><span class="mf">5<span class="highlight-4">.5</span></span><span class="p">,</span> <span class="mf">5<span class="highlight-4">.5</span></span><span class="p">,</span> <span class="mi">40</span><span class="p">,</span> <span class="mi">40</span><span class="p">);</span>
<span class="c1">// ...</span></code></pre></div>
		</div>
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
			ctx.drawImage(document.getElementById('favicon'), 13, 13, 24, 24);
		});
	</script>
</div>

## HI-DPI Canvas

Because the canvas element has a specific size in pixels, it is not DPI-aware. That is, if your operating system or
browser zoom is set to anything other than 100%, the number of physical screen pixels that represent each CSS pixel may
not be in a 1-to-1 ratio.

<div class="grid-3">
<div markdown="1">

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

<figure>
	<figcaption>Canvas</figcaption>
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
</figure>

<figure>
	<figcaption>Zoomed 3x</figcaption>
	<img style="align-self: center; margin-bottom: 15px;" src="{{ '/images/html5-canvas-tips/bad-hi-dpi.png' | absolute_url }}">
</figure>
</div>

Note how the text is blurry, and the line below it is as well, despite using our half a pixel offset trick from
[the previous section](#pixel-art-canvas) (if your ratio is 100%, just consult the screenshot)? Let's make some tweaks
to the canvas to work around this:


<div class="grid-3">
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
<span class="c1">// ...</span></code></pre></div>
		</div>
	</div>
	<figure>
		<figcaption>Canvas</figcaption>
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
	</figure>
	<figure>
		<figcaption>Zoomed 3x</figcaption>
		<img style="align-self: center; margin-bottom: 15px;" src="{{ '/images/html5-canvas-tips/good-hi-dpi.png' | absolute_url }}">
	</figure>
</div>

Note that in the case of my screenshots, the device scaling is 150%, which means for every CSS pixel there are 1.5
device pixels. That means that no matter how much scaling fanciness we do, our 1px line will never perfectly align to
the screen's pixel grid.

This graphic depicts a 150% scaling ratio between the device pixels (the white and gray grid) and CSS pixels (the black
dotted lines). The red outlines show where a line would be drawn, aligned to the CSS pixel grid. The green pixels show
the effective rasterization of the red area to the physical pixel grid.

![An example of fractional scaling causing misalignment between CSS and physical pixels.]({{ '/images/html5-canvas-tips/fractional-scaling.png' | absolute_url }}){:.no-shadow}

## ClearType Font Smoothing

Riding off our last example, let's make the text rendering *even smoother*. If the browser knows that canvas text will
be rendered against a set color, it will use [subpixel rendering][sr]{:target="_blank"} (aka ClearType). To do this, we
need to use an opaque canvas, created by passing some options to the canvas' `getContext` function.

[sr]: https://en.wikipedia.org/wiki/Subpixel_rendering

<div class="language-js highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="kd">const</span> <span class="nx">canvas</span> <span class="o">=</span> <span class="nb">document</span><span class="p">.</span><span class="nf">getElementById</span><span class="p">(</span><span class="dl">'</span><span class="s1">cleartype-canvas</span><span class="dl">'</span><span class="p">);</span>
<span class="kd">const</span> <span class="nx">ctx</span> <span class="o">=</span> <span class="nx">canvas</span><span class="p">.</span><span class="nf">getContext</span><span class="p">(</span><span class="dl">'</span><span class="s1">2d</span><span class="dl">'</span><span class="p">,</span> <span class="highlight-4"><span class="p">{</span><span class="na">alpha</span><span class="p">:</span> <span class="kc">false</span><span class="p">}</span></span><span class="p">);</span>
</code></pre></div></div>

<div class="grid-2 no-phone-layout" style="gap:0;">

<!-- <div style="grid-column: 3; font-weight: bold;text-align: center;">Zoomed 4x</div> -->

<!-- <div style="align-self: center; font-style:italic; justify-self: end;">Browser-rendered text:</div> -->

<figure>
	<figcaption>Browser-Rendered Text</figcaption>
	<div id="hello-world" style="align-self: center; text-align: center;color: grey;">Hello, World!</div>
</figure>

<figure>
	<img style="align-self: center; margin-bottom: 15px;" src="{{ '/images/html5-canvas-tips/browser-text.png' | absolute_url }}">
</figure>

<figure>
	<figcaption>Default Canvas-Rendered Text, With HI-DPI Fix</figcaption>
	<canvas id="no-cleartype-canvas" class="no-shadow" width="200" height="24" style="margin: 0 auto;display:block;"></canvas>
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
		ctx.fillText(text, 100-(size.width / 2), 24-size.fontBoundingBoxDescent);
	});
	</script>
</figure>
<img style="align-self: center; margin-bottom: 15px;" src="{{ '/images/html5-canvas-tips/bad-canvas-text.png' | absolute_url }}">

<figure>
	<figcaption>Opaque Canvas-Rendered Text, With HI-DPI and ClearType Fix</figcaption>
	<canvas id="cleartype-canvas" class="no-shadow" width="200" height="24" style="margin:0 auto;display:block;"></canvas>
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
		ctx.fillText(text, 100-(size.width / 2), 24-size.fontBoundingBoxDescent);
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
</figure>

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
