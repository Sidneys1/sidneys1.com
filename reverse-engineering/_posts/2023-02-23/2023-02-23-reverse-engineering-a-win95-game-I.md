---
layout: post
title:  "Reverse Engineering a Windows 95 Game"
subtitle: Reversing Asset Storage
categories: [programming, reverse engineering]
tags: [programming, reverse engineering]
author: Sidneys1
image: images/reverse-engineering-a-win95-game-I/hero.jpg
image_shadow: true
toc: false
excerpt_separator: <!--more-->
multipart: reverse-engineering-win95-game
---

<!-- cSpell:words Schuster DirectX autorun pakrat -->
<!-- cSpell:ignore PAKS AMOVIE DSETUP DSETUPE DSETUPJ MATHINV SSPUNINS Bmps Ihighsco RIFFÀ -->

I recently rediscovered an obscure 1997 Simon & Schuster / Marshall Media edutainment game for Windows 95 that I played
as a kid: [Math Invaders](https://archive.org/details/MathInvaders). Let's reverse engineer the game a bit and see what
we can find; are there any secrets, unused assets, etc?

<!--more-->
---

# Poking around the CD

Installing Math Invaders merely copies the EXE to `C:\MathInvaders` (or your chosen installation path). When run, the
executable checks if you have the CD inserted (searching for a path stored in the registry during installation). So in
practice, all of the resources can be found on the CD and the CD only.

```
📁 DIRECTX
📁 PAKS
📁 WIN.31
📁 WIN.95
📄 AMOVIE.EX_
🔧 AUTORUN.INF
📕 DSETUP.DLL
📕 DSETUP6E.DLL
📕 DSETUP6J.DLL
📕 DSETUPE.DLL
📕 DSETUPJ.DLL
⚙️ LAUNCH.EXE
📄 MATHINV.EX_
📄 README.TXT
⚙️ SETUP.EXE
⚙️ SPRINT.EXE
📄 SSPUNINS.EX_
```

So, we have a few directories. `PAKS` includes the game resources, while the others are all installer files for a
bundled DirectX 4.0 and "Sprint Internet Passport 3.01" (which seems to be an AOL-like service). The remaining files are
largely DLLs to support the various installers, as well as a readme for our game.

<details markdown="1">
<summary>Readme Contents, for those interested.</summary>

```
{% include_relative _readme.txt %}
```

</details><br/>


Upon installing `MATHINV.EX_` is copied to the installation directory and renamed to `MATHINV.EXE`, of course. Let's
overlook this file for now and instead take a look in the `PAKS` directory:

```
📁 LEVELS
📁 VIDEO
📄 GAME.PAK
```

`LEVELS` contains `LP##.PAK` files, where `##` is a two-digit number from 01 to 27. Video contains (unsurprisingly)
several AVI files, as this game has a few full motion video "FMV" sequences at startup and shutdown.

# PAK Files and `pakrat`

Let's poke at `GAME.PAK` in a hex editor. The first ~5K of the `GAME.PAK` file looks like this:

```
0000h  56 00 00 00 57 61 76 65 73 5C 43 6C 69 63 6B 2E  V...Waves\Click.
0010h  77 61 76 00 00 00 00 00 00 00 00 00 00 00 00 00  wav.............
0020h  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................
0030h  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................
0040h  00 00 00 00 20 17 00 00 42 6D 70 73 5C 43 75 72  .... ...Bmps\Cur
0050h  73 6F 72 2E 62 6D 70 00 00 00 00 00 00 00 00 00  sor.bmp.........
0060h  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................
0070h  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................
0080h  00 00 00 00 00 00 00 00 E8 32 00 00 42 6D 70 73  ........è2..Bmps
0090h  5C 46 6F 6E 74 2E 62 6D 70 00 00 00 00 00 00 00  \Font.bmp.......
00A0h  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................
00B0h  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................
00C0h  00 00 00 00 00 00 00 00 00 00 00 00 20 4B 00 00  ............ K..
00D0h  42 6D 70 73 5C 49 68 69 67 68 73 63 6F 2E 62 6D  Bmps\Ihighsco.bm
00E0h  70 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  p...............
00F0h  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................
0100h  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................
```

And the remainder of the file is various binary data. In fact, immediately after the ~5K run above we see the following
header, immediately recognizable as a [Waveform Audio File Format](https://en.wikipedia.org/wiki/WAV) header:

```
1720h  52 49 46 46 C0 1B 00 00 57 41 56 45 66 6D 74 20  RIFFÀ...WAVEfmt
```

This lines up with the file extension of the first string we see at the beginning of the file, `Waves\Click.wav`. A
little deduction shows that the ~5K prelude area is structured as follows:

```cpp
struct prelude {
    uint32_t count;
    struct entry {
        char name[64];
        uint32_t offset;
    } entries[];
}
```

Or, in english, we have first four bytes (a little-endian unsigned integer) representing the number of resource headers
in the list. This is followed by that number of entries, each of which is a 64-character ASCII string followed by a
four-byte offset into the PAK file where the data for that file resides. We use a little C trick here called a
"[flexible array member](https://en.wikipedia.org/wiki/Flexible_array_member)" to index past the end of our C struct.
Note that each entry doesn't need to store the length of the file - this is calculated from the offset of the next file
in the list or (in the case of the last entry) the end of the `PAK` file itself.

Armed with this knowledge, let's write a simple program to "extract" `PAK` files, which we'll call `pakrat`. The program
will take the targeted `PAK` file as a command-line argument and extract the contents to the current working directory.
Let's get started with this:

```cpp
#include <iostream>
#include <fstream>
#include <cstring>
#include <cerrno>

int main(int argc, char* argv[]) {
	if (argc < 2) {
		std::cerr << "Usage: " << argv[0] << " FILE\n";
		return 1;
	}
	std::cout << ("PAKrat 0.1\n");


	std::ifstream file(argv[1], std::fstream::in | std::fstream::binary);
	if (!file) {
		std::cerr << "Error opening '" << argv[1] << "': " << std::strerror(errno) << "\n";
		return 1;
	}

	file.seekg(0, std::ifstream::end);
	size_t file_size = file.tellg();
	std::cout << "File '" << argv[1] << "' size: " << file_size << " Bytes\n";
	file.seekg(0, std::ifstream::beg);
}
```

Running it against `GAME.PAK` produces:

```
PAKrat 0.1
File '../GAME.PAK' size: 22984537
```

So far so good! Continuing on (you'll also need to `#include <iomanip>`, and add the `struct prelude` we defined
before):

```cpp
// Let's start by getting the number of entries, so we know how large a buffer to allocate
char* buffer = (char*)malloc(sizeof(uint32_t));
file.read((char*)buffer, sizeof(uint32_t));
uint32_t count = *(uint32_t*)buffer;
std::cout << "File contains " << *(uint32_t*)buffer << " entries:\n";

// Reallocate to the appropriate size.
buffer = (char*)realloc((void*)buffer, sizeof(prelude) + (sizeof(prelude::entry) * count));
file.read(buffer + 4, sizeof(prelude::entry) * count);

// Interpret by casting to a prelude, then print all the files and their offsets.
prelude* header = (prelude*)buffer;
for (auto i = 0; i < header->count; ++i) {
	std::cout << "0x" << std::hex << std::setw(8) << std::setfill('0') << header->entries[i].offset
			  << " " << header->entries[i].name << "\n";
}
```

We now output:

```
PAKrat 0.1
File '../GAME.PAK' size: 22984537 Bytes
File contains 86 entries:
0x00001720 Waves\Click.wav
0x000032e8 Bmps\Cursor.bmp
0x00004b20 Bmps\Font.bmp
0x00009a58 Bmps\Ihighsco.bmp
--- ✂️ ---
```

Excellent! Let's refactor that last for loop a bit though:

```cpp
// Interpret by casting to a prelude, gather, then print all the files and their offsets.
prelude* header = (prelude*)buffer;
std::vector<std::tuple<char*, uint32_t, uint32_t>> entries;
for (auto i = 1; i < header->count; ++i) {
	auto& entry = header->entries[i];
	auto &prev = header->entries[i - 1];
	entries.push_back(std::make_tuple(prev.name, prev.offset, entry.offset - prev.offset));
}
auto& last = header->entries[header->count - 1];
entries.push_back(std::make_tuple(last.name, last.offset, file_size - last.offset));
```

There, now we have made a more manageable list, including sizes. Let's add some code to print it out. Sorry for the
`std::ios` cruft, formatting C++ streams is a constant annoyance:

```cpp
for (auto& entry : entries) {
	std::ios old_state(nullptr);
	old_state.copyfmt(std::cout);
	std::cout << "0x" << std::hex << std::setw(8) << std::setfill('0') << std::get<1>(entry)
			  << " " << std::get<0>(entry) << " ";
	std::cout.copyfmt(old_state);
	std::cout << std::get<2>(entry) << " Bytes\n";
}
```

```
PAKrat 0.1
File '../GAME.PAK' size: 22984537 Bytes
File contains 86 entries:
0x00001720 Waves\Click.wav 7112 Bytes
0x000032e8 Bmps\Cursor.bmp 6200 Bytes
0x00004b20 Bmps\Font.bmp 20280 Bytes
0x00009a58 Bmps\Ihighsco.bmp 346040 Bytes
--- ✂️ ---
```

Nearly there! The last push is just to extract the files (you'll want to add `#include <filesystem>` for filesystem
operations and `#include <algorithm>` for `std::replace`)!

```cpp
// Extract files
for (auto& entry : entries) {
	char* path_str = std::get<0>(entry);
	uint32_t offset = std::get<1>(entry);
	uint32_t length = std::get<2>(entry);

	// Replace Windows path separators
	std::replace(path_str, path_str + strlen(path_str), '\\', '/');

	std::filesystem::path path(path_str);
	auto filename = path.filename();
	auto parent = path.parent_path();

	// Create parent folder(s) (if needed)
	if (!parent.empty() && !std::filesystem::exists(parent)) {
		std::cout << "Creating directory " << std::quoted(parent.c_str()) << '\n';
		std::filesystem::create_directories(parent);
	}

	std::cout << "Creating file " << std::quoted(path_str) << '\n';
	std::ofstream out_file(path, std::fstream::out | std::fstream::binary);
	if (!out_file) {
		std::cerr << "Error creating file: " << std::strerror(errno) << "\n";
		continue;
	}

	// Seek to the correct location and copy the file in 1KiB chunks
	file.seekg(offset, std::ifstream::beg);
	uint32_t to_read = length;
	do {
		char buffer[1024];
		auto chunk = std::min((size_t)to_read, sizeof(buffer));
		to_read -= chunk;
		file.read(buffer, chunk);
		out_file.write(buffer, chunk);
	} while (to_read > 0);
}
```

```
PAKrat 0.1
File '../GAME.PAK' size: 22984537 Bytes
File contains 86 entries:
0x00001720 Waves\Click.wav 7112 Bytes
0x000032e8 Bmps\Cursor.bmp 6200 Bytes
0x00004b20 Bmps\Font.bmp 20280 Bytes
0x00009a58 Bmps\Ihighsco.bmp 346040 Bytes
--- ✂️ ---
Creating directory "Waves"
Creating file "Waves/Click.wav"
Creating directory "Bmps"
Creating file "Bmps/Cursor.bmp"
Creating file "Bmps/Font.bmp"
Creating file "Bmps/Ihighsco.bmp"
--- ✂️ ---
```

And that's it! You can find the full source code [in this GitHub repository](https://github.com/Sidneys1/PAKrat). Here's
a sample of an extracted asset! This is `Waves\Glose2a.wav`, an one of 3 randomized clips that play when you lose a
level:

{% assign wav = '/audio/reverse-engineering-a-win95-game-I/Glose2a.wav' | absolute_url %}
{% include embed_audio.html src=wav mimetype="audio/x-wav" %}


There are also GUI elements in `Bmps`, for example the weapon sprite sheet `Weapons.bmp`:

![weapon sprite sheet]({{ '/images/reverse-engineering-a-win95-game-I/Weapons.bmp' | absolute_url }})

There's even an exit splash screen graphic that is unused, that indicates that the game probably had a shareware or beta
release:

![beta exit splash]({{ '/images/reverse-engineering-a-win95-game-I/Exit1.bmp' | absolute_url }})

-----

Now, attentive readers may have noticed something; If the `PAK` prelude is 4+(68×86)=5852 Bytes, but the first asset
(`Waves\Click.wav`) starts at `0x1720` (Byte 5920), then what is in the interstitial 68 bytes? Let's take a look:

* Last entry <span style="background: #C649B6; color: white">name</span> and <span style="background: #7E48C4; color: white">offset</span>.
* Fist <span style="background: #47B5C1; color: white">file data</span>.

<div class="language-plaintext highlighter-rouge">
<div class="highlight">
<pre class="highlight">
<code>1690h  00 00 00 00 D5 91 50 01 <span style="background: #C649B6">57 61 76 65 73 5C 47 6C</span>  ....Õ‘P.<span style="background: #C649B6">Waves\Gl</span>
16A0h  <span style="background: #C649B6">6F 73 65 33 62 2E 77 61 76 00 00 00 00 00 00 00</span>  <span style="background: #C649B6">ose3b.wav.......</span>
16B0h  <span style="background: #C649B6">00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00</span>  <span style="background: #C649B6">................</span>
16C0h  <span style="background: #C649B6">00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00</span>  <span style="background: #C649B6">................</span>
16D0h  <span style="background: #C649B6">00 00 00 00 00 00 00 00</span> <span style="background: #7E48C4">B7 21 5A 01</span> 00 00 00 00  <span style="background: #C649B6">........</span><span style="background: #7E48C4">·!Z.</span>....
16E0h  BC 42 59 81 00 00 00 00 8C 83 59 81 8C 83 59 81  ¼BY.....ŒƒY.ŒƒY.
16F0h  88 83 59 81 3B AE F7 BF 00 20 56 81 00 00 00 00  ˆƒY�;®÷¿. V.....
1700h  8C 83 59 81 DB AE F7 BF 8C 83 59 81 DE DA F7 BF  ŒƒY.Û®÷¿ŒƒY.ÞÚ÷¿
1710h  8C 83 59 81 8C 83 59 81 E2 13 F7 BF 59 B7 5E 01  ŒƒY.ŒƒY.â.÷¿Y·^.
1720h  <span style="background: #47B5C1">52 49 46 46 C0 1B 00 00 57 41 56 45 66 6D 74 20</span>  <span style="background: #47B5C1">RIFFÀ...WAVEfmt</span></code>
</pre>
</div>
</div>

And honestly... I don't know. This space being the same length as the other asset headers makes me think whatever they
used to create these `PAK` files has an off-by-one error, and just wrote an extra entry past the end of their buffer
into uninitialized (or maybe stack/heap) memory. Or, it could be a tightly packed block of some unknown flags or
parameters to the game engine.

### A Short Aside About `PAK`

Digging further into the `LP##.PAK` file for specific levels (in this case, `LP01.PAK`) reveals additional asset types:

* `📂 Anims\`
  * 📄 `Anims.lst`
* `📂 Levels\`
  * 📄 `GameData.dat`
  * 📄 `Lp01.lev`
* `📂 Mazes\`
  * 📂 `LP01\`
    * 📄 `lp01.lws`
    * 📄 `rlp01.wad`
    * 📄 `wlp01.bsp`
* 📂 `Objects\`
  * _A variety of `.bsp`/`.BSP` files._
* 📂 `Waves\`
  * _A variety of `.WAV` files._
* 📂 `anims\` _(note the case sensitivity)_
  * _58 directories, themselves containing `.pcx` and `.pcxF` files._
* 📂 `textures\`
  * 📄 `Lp01.lst`
  * _1345 additional `.pcx` and `.pcxF` files._

Now wait a second... `.pak`, `.bsp`, `.wad`... Sounds an awful lot like
[id Tech 2](https://en.wikipedia.org/wiki/Id_Tech#id_Tech_2) (the Quake engine)! However, digging into it, id's `pak`
format is different, and these `wad` and `bsp` files won't open in any Tech 2 editors I can find. So perhaps the
developers of this engine merely took a lot of inspiration, and/or heavily modified and simplified these formats away
from the Tech 2 specifications.

This engine is almost a midway point (in capability) between Tech 1 (DOOM) and Tech 2 (Quake). It supports angled floors
and vertical viewing angle like Quake, but also only supports sprite-based creatures like Doom.

----

In the next part, we'll explore trying to reverse engineer where this game stores its settings, and see if we can't
uncover some secrets in the binary itself.
