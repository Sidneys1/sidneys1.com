---
layout: post
title:  "Raytracing!"
date:   2022-03-23 13:04:39 -0400
tags: [programming, raytracing, ongoing projects]
author: Sidneys1
image: /images/2022-03-23-raytracing/hero.png
toc: true
excerpt_separator: <!--more-->
---

Since I started programming I've had a dream in the back of my mind: *raytracers are super cool*, and I'd like to build
one myself. But with that dream accompanied another thought: *raytracers are nearly a pure expression of math*, a
discipline I am poorly qualified for.

However this winter I discovered a new programming community, [OneLoneCoder][OLC], and its leader, [javidx9][javid].
Watching the videos produced by javidx9 inspired me to take a leap of faith in myself and start this raytracing project.
The result has been amazing to see unfold as I developed first a working prototype in C#, then in C++, and finally as I
produced what hopefully is an easy to follow "tutorial" style Git repository. So, lets dive in!

<!--more-->

![finished product](/images/2022-03-23-raytracing/finished.gif)

## What is Raytracing?

Raytracing is a method of rendering three dimensional scenes that is inspired by the physics behind light and vision. In
the real world, light emanates from some source and bounces off of objects before entering our eye and being processed
by the brain. In raytracing, however, this process is reversed, and a "ray" is sent out from the virtual camera into a
scene, collecting information about the objects it encounters, eventually returning a resolved color for that pixel of
the canvas.

## How Do We Begin?

### Creating a new `olc::PixelGameEngine` Project

We're going to start with <kbd>Create a new project</kbd> in Visual Studio (I'm using 2022). Select the <kbd>Empty
Project</kbd> (C++/Windows/Console) template. I also opted for the flat directory structure option <kbd>☑ Place solution
and project in the same directory</kbd>.

![Create new project](/images/2022-03-23-raytracing/create-a-new-project.png)

We copy in the [`olcPixelGameEngine.h` file][olc-pge-header] and add it to our solution. We also add a blank `main.cpp`
and populate it with the contents of the template available in the `olcPixelGameEngine.h` header, taking care to rename
our game class to match our needs.

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

```cpp
shapes.emplace_back(std::make_unique<Sphere>());
```

When the game exits, the memory we allocated will be freed (thanks, smart pointers).

### Add constants and a way to "Sample" single pixels

We define a few constants for window geometry and begin implementing our rendering process by looping over the rows and
columns of the scene and calling a `Sample` function that takes a floating-point x,y position on the viewport and
returns a `olc::Pixel` for that location.

```cpp
// Game width and height (in pixels).
constexpr int WIDTH = 250;
constexpr int HEIGHT = 250;

// Half the game width and height (to identify the center of the screen).
constexpr float HALF_WIDTH = WIDTH / 2.0f;
constexpr float HALF_HEIGHT = HEIGHT / 2.0f;
```

```cpp
bool OnUserUpdate(float fElapsedTime) override {
    // Called once per frame

    // Iterate over the rows and columns of the scene
    for (int y = 0; y < HEIGHT; y++) {
        for (int x = 0; x < WIDTH; x++) {
            // Sample this specific pixel (converting screen coordinates to scene coordinates).
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

### Add some geometry types, enhance Shape and Sphere

We add `struct`s for vectors (`vf3d`) and rays (`ray`). A vector represents a 3-dimensional point in space or a
3-dimensional magnitude, while a ray uses two vectors, one to represent an origin point, and one to represent a
directional magnitude out from that point.

```cpp
// Struct to describe a 3D floating point vector.
struct vf3d {
    float x, y, z;
    // Default constructor.
    vf3d() = default;
    // Explicit constructor that initializes x, y, and z.
    constexpr vf3d(float x, float y, float z) : x(x), y(y), z(z) {}
    // Explicit constructor that initializes x, y, and z to the same value.
    constexpr vf3d(float f) : x(f), y(f), z(f) {}
};

// Struct to describe a 3D floating point ray (vector with origin point).
struct ray {
    vf3d origin, direction;
    // Default constructor.
    ray() = default;
    // Add explicit constructor that initializes origin and direction.
    constexpr ray(const vf3d origin, const vf3d direction) : origin(origin), direction(direction) {}
};
```

We'll also enhance our `Shape` class with properties that will allow us to describe the size, position, and color of
shapes in our scene:

```cpp
// Class to describe any kind of object we want to add to our scene.
class Shape {
public:
    vf3d origin;
    olc::Pixel fill;
    // Delete the default constructor (we'll never have a Shape with a default origin and fill).
    Shape() = delete;
    // Add explicit constructor that initializes origin and fill.
    Shape(vf3d origin, olc::Pixel fill) : origin(origin), fill(fill) {}
};
```

We'll also give the `Sphere` class a notion of a `radius`, which is not shared by all `Shape`-derived classes:

```cpp
class Sphere : public Shape {
public:
    float radius;
    // Delete the default constructor (see "Shape() = delete;").
    Sphere() = delete;
    // Add explicit constructor that initializes Shape::origin, Shape::fill, and Sphere::radius.
    Sphere(vf3d origin, olc::Pixel fill, float radius) : Shape(origin, fill), radius(radius) {}
};
```

Next, we'll want to update our `OnUserCreate` function to pass in the newly required properties of a `Sphere`. Let's
create our initial `Sphere` at the position `x=0, y=0, z=200`, where $$x$$ is lateral position, $$y$$ is vertical
position, and $$z$$ is depth (or distance from the camera). Since our camera will be at `x=0, y=0, z=0` this will
align our `Sphere` in the center of the canvas, 200 units away. We'll also give our `Sphere` a solid `olc::GREY` color,
and set the `radius` to `100`.

```diff
- shapes.emplace_back(std::make_unique<Sphere>());
+ shapes.emplace_back(std::make_unique<Sphere>(vf3d(0, 0, 200), olc::GREY, 100));
```

Finally, using our newly created `ray` type, let's construct a ray in `Sample` for a given pixel that will point into
the scene:

```cpp
// Create a ray casting into the scene from this "pixel".
ray sample_ray({ x, y, 0 }, { 0, 0, 1 });
// TODO: We now need to test if this ray hits any Shapes and produces
//       a color.
```

We create the `ray` at origin `x=x, y=y, z=0`, and set the direction to `x=0, y=0, z=1`. The direction is what we call a
*unit vector*, which means that the overall magnitude to the vector is 1 ($$\sqrt{x^2+y^2+z^2}=1$$). Using a unit vector
will simplify some math for us later.

### Add fog color and a way to sample rays

To prevent our scene from extending into infinity, and to have something to show when a ray doesn't hit *anything*, we
add a new constant: a "fog" color.

```cpp
// A color representing scene fog.
olc::Pixel FOG(128, 128, 128);
```

Additionally, we add a more specific function, `SampleRay`, that is called by `Sample` to return the color (or absence
thereof) of a ray as it extends into our scene. For now, still, this returns a color relative to the $$x$$ and $$y$$
coordinate in our scene:

```cpp
// Add a new include at the top of our file:
#include <optional>

// ---✂---

std::optional<olc::Pixel> SampleRay(const ray r) const {
    // Called to get the color produced by a specific ray.
    // This will be the color we (eventually) return.
    olc::Pixel final_color;
    // For now we're returning a color based on the screen coordinates.
    return olc::Pixel(std::abs(x * 255), std::abs(y * 255), 0);
    final_color = olc::Pixel(std::abs(r.origin.x * 255), std::abs(r.origin.y * 255), 0);
    return final_color;
}
```

Don't forget to update `Sample` accordingly:

```diff
  // Create a ray casting into the scene from this "pixel".
  ray sample_ray({ x, y, 0 }, { 0, 0, 1 });
- // TODO: We now need to test if this ray hits any Shapes and produces
- //       a color.
+ // Sample this ray - if the ray doesn't hit anything, use the color of
+ // the surrounding fog.
+ return SampleRay(sample_ray).value_or(FOG);
```

### Add intersection and sample methods to Shapes

Our `SampleRay` function has been upgraded to search for a `Shape` that it intersects with. To do this, `Shape` has been
upgraded with two new virtual methods:

```cpp
// Get the color of this Shape (when intersecting with a given ray).
virtual olc::Pixel sample(ray sample_ray) const { return fill; }

// Determine how far along a given ray this Shape intersects (if at all).
virtual std::optional<float> intersection(ray r) const = 0;
```

These methods provide the ability to determine where along a `ray` a `Shape` intersects, and to provide the color of the
`Shape` at a given `ray` intersection. Our `Sphere` class overrides the `intersection` method, though for now
the implementation only returns an empty optional.

```cpp
// Determine how far along a given ray this Circle intersects (if at all).
std::optional<float> intersection(ray r) const override {
    // TODO: Implement ray-sphere intersection.
    return {};
}
```

Finally, let's update our `Sample` function, replacing the `final_color` value we compute based on screen coordinates
with an algorithm that searches a `Shape` that intersects with our given `ray`:

```cpp
// Store a pointer to the Shape this ray intersects with.
auto intersected_shape_iterator = shapes.end();
// Also store the distance along the ray that the intersection occurs.
float intersection_distance = INFINITY;

/* Determine the Shape this ray intersects with(if any). */ {
    // Iterate over all of the Shapes in our scene.
    for (auto it = shapes.begin(); it != shapes.end(); it++) {
        // If the distance is not undefined (meaning no intersection)...
        if (std::optional<float> distance = (*it)->intersection(r)) {
            // Save the current Shape as the intersected Shape!
            intersected_shape_iterator = it;
            // Also save the distance along the ray that this intersection occurred.
            intersection_distance = distance.value();
        }
    }
    // If we didn't intersect with any Shapes, return an empty optional.
    if (intersected_shape_iterator == shapes.end())
        return {};
}
// Get the shape we discovered
const Shape &intersected_shape = **intersected_shape_iterator;
// Set our color to the sampled color of the Shape this ray with.
final_color = intersected_shape.sample(r);
```

## Rendering Shapes

### Implement ray-Sphere intersection

We'll need to overload some operators for a `vf3d`: subtraction, and dot-product. A dot-product is a useful way of
comparing two vectors to determine if they are similar. Consider two vectors, $$a$$ and $$b$$. The dot-product is a
scalar value determined like so:

$$dot(a,b) = a\cdot{}b = a_{1}b_{1}+a_{2}b_{2}+a_{3}b_{3}$$

So, for example:

$$\begin{bmatrix} 1 & 2 & 3\end{bmatrix}\cdot\begin{bmatrix} 4 & 5 & 6\end{bmatrix}\newline=\newline(1\cdot4)+(2\cdot5)+(3\cdot6)\newline=\newline4+10+18\newline=\newline32$$

Translating this to C++ gives us our dot product function:

```cpp
// Dot product (multiplication): vf3d * vf3d = float
const float operator* (const vf3d right) const {
    return (x * right.x) + (y * right.y) + (z * right.z);
}

// Subtraction: vf3d - vf3d = vf3d
const vf3d operator-(const vf3d right) const {
    return { x - right.x, y - right.y, z - right.z };
}
```

We'll also implement the equation for an intersection between a `ray` and a `Sphere`. I'm not going to go into depth
explaining the geometry here: this is a well-documented process and can be researched separately.

```cpp
std::optional<float> intersection(ray r) const override {
    return {};
    vf3d oc = r.origin - origin;
    float a = r.direction * r.direction;
    float b = 2.0f * (oc * r.direction);
    float c = (oc * oc) - (radius * radius);
    float discriminant = powf(b, 2) - 4 * a * c;
    if (discriminant < 0)
        return {};
    auto ret = (-b - sqrtf(discriminant)) / (2.0f * a);
    if (ret < 0)
        return {};
    return ret;
}
```

<fieldset class="note" markdown=1>
<legend>Note</legend>
Running our project will now render a (highly aliased and flatly-colored) Sphere!
![flat](/images/2022-03-23-raytracing/flat.png)
</fieldset>

### Add perspective rendering and depth sorting

First we'll add some additional Spheres to our scene at different Z-depths. If we run our project now, you'll see that
the Spheres added to our scene last are drawn in front of the earlier ones, even if they are further away.

```cpp
// Add some additional Spheres at different positions.
shapes.emplace_back(std::make_unique<Sphere>(vf3d(-150, +75, +300), olc::RED, 100));
shapes.emplace_back(std::make_unique<Sphere>(vf3d(+150, -75, +100), olc::GREEN, 100));
```

![Bad Z-depth](/images/2022-03-23-raytracing/bad-z.png)

To remedy that, we up date our hit check in `SampleRay` to select the object whose intersection is nearest to the `ray`
origin. Now if we run our project, the Spheres are properly sorted.

```diff
- if (std::optional<float> distance = (*it)->intersection(r)) {
+ if (std::optional<float> distance = (*it)->intersection(r).value_or(INFINITY);
+                 distance < intersection_distance) {
```

![no-perspective](/images/2022-03-23-raytracing/no-perspective.png)

However, you'll notice that all three Spheres are the same size, despite being different distances from the camera. To
fix *this*, we'll need to add perspective to our camera. We'll do this in a very simplistic manner, by having all of the
rays originate from some point, and pointing towards what you can think of as a "virtual canvas" some distance in front
of that origin point. Update `Sample` like so:

```diff
- ray sample_ray({ x, y, 0 }, { 0, 0, 1 });
+ ray sample_ray({ 0, 0, -800 }, { (x / (float)WIDTH) * 100, (y / (float)HEIGHT) * 100, 200});

  // Sample this ray - if the ray doesn't hit anything, use the color of
  // the surrounding fog.
- return SampleRay(sample_ray).value_or(FOG);
+ return SampleRay(sample_ray.normalize()).value_or(FOG);
```

Notice we call method of `ray` that we haven't defined yet: `normalize()`. Normalization produces a normalized vector
(discussed before) from a non-normalized vector by resizing the vector components in proportion to their length such
that the overall length is still 1. Normalization is defined as (with $$v\cdot{}v$$ of course being the dot product of
itself):

$$normalize(v) = \frac{v}{\sqrt{v\cdot{}v}}$$

Let's add `normalize()` to both `ray` and `vf3d`:

```cpp
// ---✂--- In ray:

// Return a normalized version of this ray (magnitude == 1).
const ray normalize() const {
    return { origin, direction.normalize() };
}

// ---✂--- In vf3d:

// Division: vf3d / float = vf3d
const vf3d operator/(float divisor) const {
    return { x / divisor, y / divisor, z / divisor };
}

// Return a normalized version of this vf3d (magnitude == 1).
const vf3d normalize() const {
    return (*this) / sqrtf((*this) * (*this));
}
```

By normalizing this ray we get rays properly fanning out in a perspective.

<fieldset class="note" markdown=1>
<legend>Note</legend>
Running our project will now produce a proper perspective rendering of our three flat-shaded Spheres, at the correct
depths.
![Perspective rendering.](/images/2022-03-23-raytracing/perspective.png)
</fieldset>

### Add a Plane Shape, and apply fog

First we'll add a new type of `Shape`: a `Plane`. This is a flat surface extending infinitely in all directions. I'm not
going to go into depth about the intersection algorithm, as that's basic geometry and is better explained elsewhere.
Unlike a `Sphere`, orientation matters to a `Plane`, so we'll also add a "direction" `vf3d` that will indicate the
normal pointing away from the surface.

```cpp
// Subclass of Shape that represents a flat Plane.
class Plane : public Shape {
public:
	vf3d direction;

	// Add explicit constructor that initializes
	Plane(vf3d origin, vf3d direction, olc::Pixel fill) : Shape(origin, fill), direction(direction) {}

	// Determine how far along a given ray this Plane intersects (if at all).
	std::optional<float> intersection(ray sample_ray) const override {
		auto denom = direction * sample_ray.direction;
		if (fabs(denom) > 0.001f) {
			auto ret = (origin - sample_ray.origin) * direction / denom;
			if (ret > 0) return ret;
		}
		return {};
	}
};
```

We will also override the `sample` virtual method for the first time to provide a checkerboard pattern that will make
the perspective rendering we added last time really pop.

```cpp
// Get the color of this Plane (when intersecting with a given ray).
// We're overriding this to provide a checkerboard pattern.
olc::Pixel sample(ray sample_ray) const override {
	// Get the point of intersection.
	auto intersect = (sample_ray * intersection(sample_ray).value_or(0.0f)).end();

	// Get the distances along the X and Z axis from the origin to the intersection.
	float diffX = origin.x - intersect.x;
	float diffZ = origin.z - intersect.z;

	// Get the XOR the signedness of the differences along X and Z.
	// This allows us to "invert" the +X,-Z and -X,+Z quadrants.
	bool color = (diffX < 0) ^ (diffZ < 0);

	// Flip the "color" boolean if diff % 100 < 50 (e.g., flip one half of each 100-unit span.
	if (fmod(fabs(diffZ), 100) < 50) color = !color;
	if (fmod(fabs(diffX), 100) < 50) color = !color;

	// If we're coloring this pixel, return the fill - otherwise return DARK_GREY.
	if (color)
		return fill;
	return olc::DARK_GREY;
}
```

To do this we'll also be adding some new operator overloads to both `vf3d` and `ray`, and we'll also add a new method to
`ray` that returns the `vf3d` representing the endpoint of the `ray`.

```cpp
// ---✂--- In vf3d:

// Addition: vf3d + vf3d = vf3d
const vf3d operator+(const vf3d right) const {
	return { x + right.x, y + right.y, z + right.z };
}

// Multiplication: vf3d * float = vf3d
const vf3d operator*(float factor) const {
	return { x * factor, y * factor, z * factor };
}

// ---✂--- In ray:

// Multiplication: ray * float = ray
const ray operator*(float right) const {
	return { origin, direction * right };
}

// Return the vf3d at the end of this ray.
const vf3d end() const {
	return origin + direction;
}
```

Finally, we'll add a new `Plane` to our scene just below our `Sphere`s. Note that since we render our canvas top to
bottom, +Y is down, while -Y is up.

```cpp
// Add a "floor" Plane
shapes.emplace_back(std::make_unique<Plane>(vf3d(0, 200, 0 ), vf3d(0, -1, 0), olc::Pixel(204, 204, 204)));
```

<fieldset class="note" markdown=1>
<legend>Note</legend>

Running our project now you'll see the checkerboard pattern continue off to the horizon - *however*, it appears
further up on the canvas than you might expect. *Additionally*, the checkerboard pattern gets very garbled as the
checks gets smaller than a single pixel, creating a sort of unexpected and disorienting moire pattern. Perhaps drawing
surfaces *that* far away isn't good...

*Coming soon: a screenshot.*
<!-- TODO: ![Plane.]() -->

</fieldset>

To remedy this, we'll add the concept of Fog. We already have a Fog color, for when a ray doesn't hit anything. This new
concept applies the idea of there being some extreme translucency to the nothingness between a ray's origin and the
`Shape` it intersects with. We'll begin by adding two new constants, one to define the maximum distance at which an
`Shape` would be visible, and the other as the reciprocal of that.

```cpp
// Fog distance and reciprocal (falloff).
constexpr float FOG_INTENSITY_INVERSE = 3000;
constexpr float FOG_INTENSITY = 1 / FOG_INTENSITY_INVERSE;
```

Now when we're determining the color of a ray in `SampleRay` we can check if the intersection distance is greater than
that of the max Fog distance. If so, we'll immediately return the Fog color and skip further calculation. If the
distance is lower, however, we want to smoothly transition between the `Shape`'s color and the Fog's color, depending on
the distance.

```cpp
// Quick check - if the intersection is further away than the furthest Fog point,
// then we can save some time and not calculate anything further, since it would
// be obscured by Fog regardless.
if (intersection_distance >= FOG_INTENSITY_INVERSE)
	return FOG;

// Set our color to the sampled color of the Shape this ray with.
final_color = intersected_shape.sample(r);

// Apply Fog
if (FOG_INTENSITY)
	final_color = lerp(final_color, FOG, intersection_distance * FOG_INTENSITY);
```

To do this, we've referenced a function called `lerp` - short for "linear interpolation" - that we haven't defined yet.
This function smoothly mixes two colors based on a floating point value between 0.0 and 1.0.

```cpp
// Apply a linear interpolation between two colors:
//  from |-------------------------------| to
//                ^ by
olc::Pixel lerp(olc::Pixel from, olc::Pixel to, float by) const {
	if (by <= 0.0f) return from;
	if (by >= 1.0f) return to;
	return olc::Pixel(
		from.r * (1 - by) + to.r * by,
		from.g * (1 - by) + to.g * by,
		from.b * (1 - by) + to.b * by
	);
}
```

<fieldset class="note" markdown=1>
<legend>Note</legend>

Running our project now displays our Spheres as before, plus the checkerboard Plane of the floor, smoothly fading
into the distance.

*Coming soon: a screenshot.*
<!-- TODO: ![Fog.]() -->

</fieldset>

Note that as our scene and renderer grow in complexity we'll begin to see lower and lower frame-rates when running our
project. Switching our compilation mode to Release and running without debugging can help, as the compiler will more
aggressively apply optimizations. Feel free to experiment with optimization strategies in the Release compilation
settings.

## More to Come...

This page is still unfinished! Don't worry, I've finished this project, it's just a matter of writing up the rest of the
article. In the meantime, check out the [GitHub repo][gh] to see the complete project.

[OLC]: https://community.onelonecoder.com/
[javid]: https://www.youtube.com/channel/UC-yuWVUplUJZvieEligKBkA
[gh]: https://github.com/Sidneys1/OlcPixelRayTracer
[olc-pge-header]: https://github.com/OneLoneCoder/olcPixelGameEngine/releases/latest/download/olcPixelGameEngine.h
