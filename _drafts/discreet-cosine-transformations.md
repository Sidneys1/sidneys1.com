---
layout: post
title:  "DCT Playground"
subtitle: "Let's JPEG-compress music!"
# date:   2022-03-23 13:04:39 -0400
# tags: [programming]
# series: Raytracing
author: Sidneys1
# image: /images/2022-03-23-raytracing/hero.png
# toc: true
excerpt_separator: <!--more-->
permalink: /dct-playground.html
---

A discreet cosine transform (<dfn><abbr title="Discreet Cosine Transform">DCT</abbr></dfn>) is a method of encoding
complex data as a series of weights that specify how to sum a series of cosine functions oscillating at different
frequencies. Woof! That's a mouth full. Put more simply, any set of $$n$$ values can be expressed as a set of $$n$$
weights to waves produced by the $$\cos$$ function. Let's try and explore this concept intuitively!

<!--more-->

<!--

So for example, the data on the left could be expressed as the set of weights on the right:

$$
\mathrm{dct}\big(\begin{bmatrix}
0.12, & -0.30, & 0.45
\end{bmatrix}\big)=\begin{bmatrix}
-0.98, & 0.70, & 0.23
\end{bmatrix}
$$

This would result in this function that produces a curve that, when sampled at three points, would recreate our input
values $$0.12$$, $$-0.30$$, and $$0.45$$:

$$
-0.98+\cos(x\pi)\cdot0.7+\cos(x\pi2)\cdot0.23
$$
<!---->

Here on the left we can see an **Input** waveform that we're trying to match. To its right we see a series of
$$\cos(Nx)$$-based waves (where $$N$$ increases as we go across) that are scaled by some $$\theta$$. These sum together
to create the original wave - conversely, if we subtract each of them from the original wave, we get zero (a flat line)
as seen in the **Output** graph.

<div style="height: 278px; width: calc(100%+60px); position: relative;margin: 0 -30px;">
	<canvas data-terms="4" data-readonly="true" data-mean="false" data-solve="true" width="1" height="1"></canvas>
</div>

Try playing with this yourself; see if you can find the correct $$\theta$$ value for this curve:

<div style="height: 278px; width: 100%; position: relative;">
	<canvas data-terms="1" data-input-terms="2" data-mean="false" width="1" height="1"></canvas>
</div>

Uh-oh! No matter what we do, we can't seem to quite match this curve. That's because that particular curve is defined
by two terms: $$\cos(x)\theta_1$$ and $$\cos(2x)\theta_2$$. The second term adds some higher-frequency data that we
can't match with our single variable term. Let's try again, this time with an appropriate number of variable terms for
the input:

<div style="height: 278px; width: 100%; position: relative;">
	<canvas data-terms="2" data-mean="false" width="1" height="1"></canvas>
</div>

Tricky to get exactly right by hand, isn't it? Here's a tip, though: as we get each $$\theta$$ closer to the appropriate
value, the **Output** curve gets _smaller_. Let's add a way to display the $$\overline{y}$$ (average absolute deviation
of $$y$$ from 0), and add another term while we're at it:

<div style="height: 278px; width: 100%; position: relative;">
	<canvas data-terms="3" width="1" height="1"></canvas>
</div>

You can tweak each $$\theta$$ to your heart's content, watching the **Output** $$\overline{y}$$ to find the minimum
value. It's not a perfect system, the minimum of one term can change as other terms change, but it's good enough for
this hand-guided version. Once each $$\theta$$ is set correctly, the **Output** should be flat and turn green to
indicate you've matched the input curve exactly!

## A Quick Aside About JPEG

[![The origin of "Needs more JPEG".](https://i.kym-cdn.com/photos/images/original/000/923/167/287.png)](https://knowyourmeme.com/memes/needs-more-jpeg)
{:style="float:right;margin-left: 1em;"}

At this point you might be wondering what all this has to do with JPEG compression and the weird artifacts you see in
all those "needs more JPEG" memes. Well, JPEG uses this <abbr>DCT</abbr> concept to achieve its image compression. The
entire image is broken up into blocks 8 pixels square. Then a two-dimensional version of <abbr>DCT</abbr> is applied
using 64 different cosine waves. The result is a series of 64 $$\theta$$ values that can reconstruct the exact same
image. Why 64? Because to arbitrarily handle any $$N$$ number of input values we have to have at least $$N$$ different
cosine waves.

![JPEG DCT](https://upload.wikimedia.org/wikipedia/commons/5/5e/Idct-animation.gif)
{: style="float:left;margin-right:1em;"}

"But wait," you ask, "8x8 pixels is already 64 values. If we're representing 64 values as 64 other values, how is that
achieving any space savings?" A good question! In a bitmap image, each of those 64 values represents the discreet color
corresponding to an $$x,y$$ location within the image. Because these values have no correlation between their value and
their order it's hard to compress. But with the 64 DCT values their position is ordered by the *frequency* of the wave.
So the first value in the 64 DCT thetas is a big sweeping curve, while the 64th would be a crazy zig-zag up and down.

The human eye and brain work mostly off of low-frequency data, the broad strokes. So if we find some way to discard or
better compress the higher-frequency values, we can gain some space savings. JPEG specifically does this by *quantizing*
the 64 DCT entries; which means each entry is divided by a quantization factor, $$Q$$. So, for a quick illustration,
a DCT of $$\begin{bmatrix}-415.38, & -30.19, & -61.20, & ...\end{bmatrix}$$ might get divided by a quantization matrix
$$Q=\begin{bmatrix}16, & 11, & 10, & ...\end{bmatrix}$$, resulting in an output
$$\begin{bmatrix}-25.96, & -2.74, -6.12, ...\end{bmatrix}$$.

"But wait, that's still not smaller..." Well, yeah. We're getting there. You see, the higher-frequency portions of the
DCT get divided by larger values, *and* we're also going to round the results to the nearest integer. So, as another
example, this time from the end of the matrices (where the higher-frequency data is):

$$
\left\lfloor
\frac{\left[\begin{smallmatrix}..., & 0.10, & 0.50, && 1.68\end{smallmatrix}\right]}{Q=\left[\begin{smallmatrix}..., & 100, & 103, && 99\end{smallmatrix}\right]}
\right\rfloor
=\begin{bmatrix}..., & 0, & 0, & 0\end{bmatrix}
$$

Now most of the high-frequency data in the list have become zeros, which compresses very well with schemes like
<dfn>run-length encoding (<abbr title="run-length encoding">RLE</abbr>)</dfn>.

The actual implementation of all of this is quite a bit more complex than I've described, and I highly recommend reading
the [Wikipedia article on JPEG encoding](https://en.wikipedia.org/wiki/JPEG#Encoding){:target="_blank"}. For the
purposes of this article, though, I think I've explained well enough how DCTs can help achieve compression.

## A Return to Waves
{: style="clear:both;" }

Now, as you might suspect, an actual discreet cosine transform is not quite as simple as $$\cos(Nx)\theta_N$$ for $$N$$
terms. The actual formula for an orthonormal DCT-II (the form used to *encode* a DCT) is...

$$
X_k=\sum_{n=0}^{N-1}Sx_n\cos\left[\frac{\pi}{N}(n+\frac{1}{2})k\right]\text{ for } ~ k=0,\ \dots\ N-1\text{ and }S=
\begin{cases}
 \frac{1}{\sqrt{N}}, & \text{if }k=0 \\
 \sqrt{\frac{2}{N}}, & \text{otherwise.}
\end{cases}
$$

...where $$k$$ is the index into $$X$$ (the output array of DCT values), $$S$$ is the orthonormal scaling factor, and
$$N$$ is the length of $$x$$ (the input data). So you can see that each data point in the DCT output is a sum of the
input data point multiplied by the sum of a bunch of $$\cos$$ waves of various frequencies. Let's also take a look at it
as code (in this case, Python):

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

Here's a waveform from an actual sound[^1]!

<div style="height: 278px; width: calc(100%+60px); position: relative;margin: 0 -30px;">
	<canvas data-class="DCT" data-src="{{ '/assets/posts/samples.json' | absolute_url }}" data-auto="true" data-terms="4" width="1" height="1"></canvas>
</div>

<script src="{{ '/assets/posts/discreet-cosine-transformations.js' | absolute_url }}" defer></script>

[^1]: [hello.mp3 by james11111][hellomp3]{: target="_blank" }; License: [CC-A 3.0][cca]{: target="_blank" }.

[hellomp3]: https://freesound.org/people/james11111/sounds/34312/
[cca]: http://creativecommons.org/licenses/by/3.0/
