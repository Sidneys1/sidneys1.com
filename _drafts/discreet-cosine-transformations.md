---
layout: post
title:  "DCT Playground"
subtitle: "Have you ever heard JPEG compression before?"
tags: [programming, math]
author: Sidneys1
excerpt_separator: <!--more-->
---

Every sound you've ever heard is a wave, and complex waves can be formed from the sum of many simpler ones. A discreet
cosine transform (<dfn><abbr title="Discreet Cosine Transform">DCT</abbr></dfn>) is a way to convert between a complex
wave and the many simpler waves that comprise it. Let's explore this powerful concept with some hands-on interactive
demonstrations, and see how it can be applied to a variety of different problems in computer science.

<!--more-->

<noscript markdown=1>
<div class="note">
<div class="note-title">Note</div>
Sorry, the interactive widgets on this page rely on scripting to function! Please enable scripting and reload the page.
</div>
</noscript>

<div class="note" markdown=1>
<div class="note-title">Note</div>
Sorry, this page won't display well on a mobile device - most of the illustrations are designed for a screen >1200px
wide.
</div>

## Gnarly Waves, Dude!

We're going to be using [cosine][cw]{:target="_blank"} a lot; simply put this is a function that produces a sine wave
over its input value -- the simplest wave you can think of. By adding a multiplier to the input, we can scale the wave
horizontally, making it cross over the *y*-axis more times over the same range; this increases the *frequency* of the
wave it produces.

As a more technical definition: cosine is a trigonometric function that takes in an angle $$\theta$$ and produces a
value between 0 and 1 that describes the ratio between the length of the hypotenuse and adjacent side of a right
triangle formed by the specified $$\theta$$. If we graph this as $$y=\cos(x),\text{ with }x=0,\ \dots\ \pi$$ we get a
simple wave that starts at 1, crosses the *y*-axis at $$\frac{\pi}{2}$$, and ends at -1. If we add some multiplier,
$$y=\cos(kx)$$, we will begin to see the frequency increase, noticeable as each wave crossing over the *y*-axis $$k$$
times.

[cw]: https://en.wikipedia.org/wiki/Sine_and_cosine

<div style="height:178px; width:calc(100%+60px); margin:0 -30px; margin-bottom:15px;">
	<canvas data-terms="6" width="1" height="1" data-class="Cos"></canvas>
</div>

Adding together waves of different frequencies produces a more complex wave, for example
$$y=\frac{\cos(2x)}{2}+\frac{\cos(8x)}{2}$$ (dividing by two here so that the output falls in the range -1 to 1):

<div style="height: 178px; width: 100%; margin-bottom: 15px;">
	<canvas data-terms="2" data-k-start="2" data-k-step="6" width="1" height="1" data-class="CosAdd"></canvas>
</div>

<div class="note" markdown=1 style="float:right;margin-left:1em;max-width:min(300px, 50%);font-size: x-small;">
<div class="note-title">Note</div>
Refresh the page! The *θ* values are random every time.
</div>

We can also control how much each wave contributes to the end result by multiplying it by some $$\theta$$. Our equation
has now grown into $$y=\sum_{k=1}^{N}\cos(kx)\cdot\theta_k$$. So, for $$N=3$$ we get:

<div style="height: 178px; width: 100%; margin-bottom: 15px;clear:both;">
	<canvas data-terms="3" data-k-step="1" data-random-terms="true" width="1" height="1" data-class="CosAdd"></canvas>
</div>

Because subtraction is the inverse of addition, we can also perform the reverse operation: sequentially subtracting
simple waves from a complex one to arrive at zero (a flat line). Here on the left we can see an **Input** wave, and to
its right we a series of $$\cos(kx)$$-based waves that are each scaled by some $$\theta_k$$. The **Output** graph shows
the result of subtracting each of the cosine waves from the input.

<div style="height: 278px; width: calc(100%+60px); position: relative;margin: 0 -30px;clear:both;">
	<canvas data-terms="4" data-readonly="true" data-mean="false" data-solve="true" width="1" height="1"></canvas>
</div>

Note that we also added a $$k=0$$ curve. The cosine of 0 is 1, so this produces a flat line, allowing $$\theta_0$$ to to
adjust the overall height of the output, and is called the <dfn>DC coefficient</dfn> or <dfn>constant component</dfn>.
The other terms ($$k\geq1$$) are called the <dfn>AC coefficients</dfn> or <dfn>alternating components</dfn>. Try playing
with this yourself; see if you can find the correct $$\theta$$ values for this curve:

<div style="height: 278px; width: 100%; position: relative;">
	<canvas data-terms="2" data-input-terms="3" data-mean="false" width="1" height="1"></canvas>
</div>

Uh-oh! No matter what we do, we can't seem to quite match this curve. That's because that particular curve is actually
defined by *three* terms: $$y=\sum_{k=0}^{2}\cos(kx)\cdot\theta_k$$. The third term adds some higher-frequency data that
we can't match with our two variable terms. Let's try again, this time with an appropriate number of variable terms for
the input:

<div style="height: 278px; width: 100%; position: relative;">
	<canvas data-terms="3" data-mean="false" width="1" height="1"></canvas>
</div>

So, the more complex the wave we're trying to match, the more terms we have to add. Just for fun, here's a whole bunch
of terms to fiddle with:

<div style="height: 278px; width: calc(100%+60px); position: relative; margin: 0 -30px;">
	<canvas data-terms="4" data-mean="false" width="1" height="1"></canvas>
</div>

<!-- Tricky to get exactly right by hand, isn't it? Here's a tip, though: as we get each $$\theta$$ closer to the appropriate
value, the **Output** curve gets _smaller_. Let's add a way to display the $$\overline{y}$$ (average absolute deviation
of $$y$$ from 0), and add another term while we're at it:

<div style="height: 278px; width: 100%; position: relative;">
	<canvas data-terms="3" width="1" height="1"></canvas>
</div>

You can tweak each $$\theta$$ to your heart's content, watching the **Output** $$\overline{y}$$ to find the minimum
value. It's not a perfect system, the minimum of one term can change as other terms change, but it's good enough for
this hand-guided version. Once each $$\theta$$ is set correctly, the **Output** should be flat and turn green to
indicate you've matched the input curve exactly! -->

## A Quick Sidebar About JPEG

Let's talk some very quick math. If we have a value $$a$$, a function $$f(a)=b$$ that is reversible ($$f^{-1}(b)=a$$),
then as long as we know how $$f^{-1}$$ works we can store $$b$$ and be able to get back $$a$$ whenever we want
($$a\Leftrightarrow{}b$$). This is handy if $$b$$ has some special property that makes storing it more attractive
than storing $$a$$.

Well, that's exactly what the discreet cosine transform (DCT) is! It's a function that takes some input array and
produces a same-length array of values; this is called the DCT-II. The values that it outputs can be thought of as our
*θ* values in the previous section. The inverse function for the DCT-II is the DCT-III (sometimes also called the IDCT),
which takes our array from the DCT-II and turns them back into the original input array.

$$
\begin{align*}
    A &= \begin{bmatrix}x, & y, & z, & \dots\end{bmatrix} \\
    \text{DCT-II}(A) &= B \\
    \text{DCT-III}(B) &= A \\
    &\therefore\\
    A &\Leftrightarrow B \\
    \text{DCT-II} & \Leftrightarrow \text{DCT-III}
\end{align*}
$$

[![The origin of "Needs more JPEG".](https://i.kym-cdn.com/photos/images/original/000/923/167/287.png)](https://knowyourmeme.com/memes/needs-more-jpeg)
{:style="float:right;margin-left: 1em;"}

At this point you might be wondering what all this has to do with JPEG compression and the weird artifacts you see in
all those "needs more JPEG" memes. Well, JPEG uses this DCT concept to achieve its image compression. The entire image
is broken up into blocks 8 pixels square (64 values). Then a two-dimensional version of the DCT-II is applied using 64
different cosine waves. The result is a series of 64 *θ* values that can reconstruct the exact same image.

![JPEG DCT](https://upload.wikimedia.org/wikipedia/commons/5/5e/Idct-animation.gif)
{: style="float:left;margin-right:1em;margin-bottom:0;"}

> "But wait, that's just turning 64 values into another 64 values. How is that achieving any space savings?"

A good question! In a bitmap image, each of those 64 values represents the discreet color
corresponding to an $$x,y$$ location within the image. Because these values have no correlation between their value and
their position in the array, they are hard to compress. Compression *really* likes adjacent values with some meaningful
correlation. In the DCT-II output, values are ordered by the *frequency* of the wave they control.

> "That's still not a correlation between the actual *θ* values and their position..."

The human eye and brain work mostly off of low-frequency data, the broad strokes. So if we find some way to discard or
better compress the higher-frequency values, we can gain some space savings. JPEG specifically does this by *quantizing*
the 64 DCT entries; which means each entry is divided by a quantization factor, $$Q$$. So, for a quick illustration,
a DCT of $$\begin{bmatrix}-415.38, & -30.19, & -61.20, & ...\end{bmatrix}$$ might get divided by a quantization matrix
$$Q=\begin{bmatrix}16, & 11, & 10, & ...\end{bmatrix}$$, resulting in an output
$$\begin{bmatrix}-25.96, & -2.74, -6.12, ...\end{bmatrix}$$.

> "That's still not smaller..."

Well, yeah. We're getting there. You see, the higher-frequency portions of the DCT get divided by larger values, *and*
we're also going to round the results to the nearest integer. So, as another example, this time from the end of the
matrices where the higher-frequency data is (and using $$\lfloor x\rceil$$ annotation to denote rounding):

$$
\left\lfloor
\frac{\left[\begin{smallmatrix}..., & 0.10, & 0.50, && 1.68\end{smallmatrix}\right]}{Q=\left[\begin{smallmatrix}..., & 100, & 103, && 99\end{smallmatrix}\right]}
\right\rceil
=\begin{bmatrix}..., & 0, & 0, & 0\end{bmatrix}
$$

Now most of the high-frequency data in the list have become zeros, which compresses very well with schemes like
<dfn>[run-length encoding][re]{:target="_blank"} (<abbr title="run-length encoding">RLE</abbr>)</dfn>. JPEG specifically
employs both RLE and [Huffman coding][hc]{:target="_blank"}. The actual implementation of all of this is quite a bit
more complex than I've described, and I highly recommend reading the [Wikipedia article][je]{:target="_blank"}. For the
purposes of this post, though, I think I've explained well enough how DCTs can help achieve compression.

[re]: https://en.wikipedia.org/wiki/Run-length_encoding
[hc]: https://en.wikipedia.org/wiki/Huffman_coding
[je]: https://en.wikipedia.org/wiki/JPEG#Encoding

Now, as you might suspect, an discreet cosine transform is not quite as simple as the $$\cos(kx)\cdot\theta_k$$ function
we were using in the previous section. The actual formula for an orthonormal DCT-II is:

$$
X_k=\sum_{n=0}^{N-1}Sx_n\cos\left(\frac{\pi}{N}(n+\frac{1}{2})k\right)\text{ for } ~ k=0,\ \dots\ N-1\text{ and }S=
\begin{cases}
 \frac{1}{\sqrt{N}}, & \text{if }k=0 \\
 \sqrt{\frac{2}{N}}, & \text{otherwise.}
\end{cases}
$$

...where $$k$$ is the index into $$X$$ (the output array of DCT values), $$S$$ is the orthonormal scaling factor, and
$$N$$ is the length of $$x$$ (the input data). If you're like me, and it is easier to read code than mathematical
formulae, here's a Python transliteration of the above:

```py
import math, random

# Let's just generate random input for our example.
x = [random.random() for _ in range(64)]

# `N` is the length of our input.
N = len(x)

X = [0] * N  # Let's start with an array of size `N`, filled with zeros.

# `range` will iterate through 0...N-1.
for k in range(0, N):
    # Our scaling factor.
    S = (1 / math.sqrt(N)) if k == 0 else (math.sqrt(2/N))
    # Perform our sum; again, `range` will iterate 0...N-1.
    X[k] = sum(S * x[n] * math.cos(math.pi / N * (n + 0.5) * k)
               for n in range(0, N))
```

## A Return to Waves
{: style="clear:both;" }

Here's 32 **Input** samples of a waveform from an actual recording[^1], and the 32 DCT values that can be used to
reconstruct it as **Output**. These values haven't been normalized in any way, so they have no specific range, but
generally fall into ±8 at the maximum. You can tweak any of the values to see the output change.

[^1]: [hello.mp3 by james11111][hellomp3]{: target="_blank" }; License: [CC-A 3.0][cca]{: target="_blank" }.
[hellomp3]: https://freesound.org/people/james11111/sounds/34312/
[cca]: http://creativecommons.org/licenses/by/3.0/

<div style="height: 278px; width: calc(100%+60px); position: relative;margin: 0 -30px;">
	<canvas data-class="DCT" data-src="{{ '/assets/posts/samples.json' | absolute_url }}" width="1" height="1"></canvas>
</div>

Of course, as we learned in the last section, there's really no "win" by turning 32 values into 32 other values, so
let's start playing with *truncation* and *quantization*.

### Truncation: Just Throwing Away Garbage

...

### Quant-a-tize Me, Cap'n!

Now let's play with quantization. As you tweak each element of the quantization array, you should see floating-point
error accumulate on the **Output** graph. The higher each value, the more error can accumulate, and at some point the
entire *θ* will be quantized to 0.

<div style="height: 278px; width: calc(100%+60px); position: relative;margin: 0 -30px;">
	<canvas data-class="Quant" data-src="{{ '/assets/posts/samples.json' | absolute_url }}" width="1" height="1"></canvas>
</div>

<script src="{{ '/assets/posts/discreet-cosine-transformations.js' | absolute_url }}" defer></script>
