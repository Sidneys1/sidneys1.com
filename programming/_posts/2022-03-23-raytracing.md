---
layout: post
title:  "Raytracing!"
date:   2022-03-23 13:04:39 -0400
tags: [programming, raytracing, ongoing projects]
author: Sidneys1
image: /images/2022-03-23-raytracing/hero.png
toc: true
---

Since I started programming I've had a dream in the back of my mind: *raytracers are super cool*, and I'd like to build
one myself. But with that dream accompanied another thought: *raytracers are nearly a pure expression of math*, a
discipline I am poorly qualified for.

However this winter I discovered a new programming community, [OneLoneCoder][OLC], and its leader, [javidx9][javid].
Watching the videos produced by javidx9 inspired me to take a leap of faith in myself and start this raytracing project.
The result has been amazing to see unfold as I developed first a working prototype in C#, then in C++, and finally as I
produced what hopefully is an easy to follow "tutorial" style Git repository. So, lets dive in!

![finished product](/images/2022-03-23-raytracing/finished.gif)

## What is Raytracing?

Raytracing is a method of rendering three dimensional scenes that is inspired by the physics behind light and vision. In
the real world, light emanates from some source and bounces off of objects before entering our eye and being processed
by the brain. In raytracing, however, this process is reversed, and a "ray" is sent out from the virtual camera into a
scene, collecting information about the objects it encounters, eventually returning a resolved color for that pixel of
the canvas.

## How Do We Begin?

### Create new, empty Visual Studio project

We're going to start with <kbd>Create a new project</kbd> in Visual Studio (I'm using 2022). Select the <kbd>Empty
Project</kbd> (C++/Windows/Console) template. I also opted for the flat directory structure option <kbd>☑ Place solution
and project in the same directory</kbd>.

![Create new project](/images/2022-03-23-raytracing/create-a-new-project.png)

### Add PGE header and create a game from template

We copy in the `olcPixelGameEngine.h` file and add it to our solution. We also add a blank `main.cpp` and populate it
with the contents of the template available in the `olcPixelGameEngine.h` header, taking care to rename our game class
to match our needs.

<fieldset class="note" markdown=1>
<legend>Note</legend>
Running our project will render a default PixelGameEngine scene: a 256x240 canvas of random pixels, magnified 4x:
![rainbow](/images/2022-03-23-raytracing/rainbow.png)
</fieldset>

## Setting the Scene

### Add basic Shapes and a vector of shapes to render

We create a base class `Shape` and derived class `Sphere` (blank for now) that we will use to define our renderable
objects in the future.

We also add a `std::vector` of `std::unique_ptr<Shape>` to our game class. This will allow us to add new `Shape`-derived
objects to our scene:

```c++
shapes.emplace_back(std::make_unique<Sphere>());
```

Finally, when the game exits, the memory we allocated will be freed (thanks, smart pointers).

<!-- 
<fieldset class="note" markdown=1>
<legend>Note</legend>
Running our project will now render a solid magenta canvas.
</fieldset> 
-->

### Add constants and a way to "Sample" single pixels

We define a few constants for window geometry and begin implementing our rendering process by looping over the rows and
columns of the scene and calling a `Sample` function that takes a floating-point x,y position on the viewport and
returns a `olc::Pixel` for that location.

```c++
/***** CONSTANTS *****/

// Game width and height (in pixels).
constexpr int WIDTH = 250;
constexpr int HEIGHT = 250;

// Half the game width and height (to identify the center of the screen).
constexpr float HALF_WIDTH = WIDTH / 2.0f;
constexpr float HALF_HEIGHT = HEIGHT / 2.0f;
```

```c++
bool OnUserUpdate(float fElapsedTime) override {
    // Called once per frame

    // Iterate over the rows and columns of the scene
    for (int y = 0; y < HEIGHT; y++) {
        for (int x = 0; x < WIDTH; x++) {
            // Sample this specific pixel (converting screen coordinates
            // to scene coordinates).
            auto color = Sample(x - HALF_WIDTH, y - HALF_HEIGHT);
            Draw(x, y, color);
        }
    }

    return true;
}

olc::Pixel Sample(float x, float y) const {
    // Called to get the color of a specific point on the screen.

    // For now we're returning a color based on the screen coordinates.
    return olc::Pixel(std::abs(x * 255), std::abs(y * 255), 0);
}
```

<fieldset class="note" markdown=1>
<legend>Note</legend>
Running our project will now render a 250x250 canvas at 2x magnification. Our magenta fill has been replaced with a
color pattern converging in the center of the canvas:
![identity](/images/2022-03-23-raytracing/identity.png)
</fieldset>

<!-- ## Prepare For Rendering

### Add some geometry types, enhance Shape and Sphere

We add structs for vectors and rays, and enhance our `Shape` and `Sphere` classes with properties that will allow us to
describe their size and position in our scene. -->

<!-- <fieldset class="note" markdown=1>
<legend>Note</legend>
Running our project produces no differences from the last commit.
</fieldset> -->

## More to Come...

This page is still unfinished! Don't worry, I've finished this project, it's just a matter of writing up the rest of the
article. In the meantime, check out the [GitHub repo][gh] to see the complete project.

[OLC]: https://community.onelonecoder.com/
[javid]: https://www.youtube.com/channel/UC-yuWVUplUJZvieEligKBkA
[gh]: https://github.com/Sidneys1/OlcPixelRayTracer