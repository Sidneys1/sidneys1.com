---
layout: post
title:  "Reverse Engineering a Windows 95 Game"
subtitle: "Editor Mode, and Conclusion"
categories: [reverse-engineering]
tags: [programming, reverse-engineering, ghidra]
author: Sidneys1
# image: images/reverse-engineering-a-win95-game-III/hero.png
# image_shadow: false
toc: false
excerpt_separator: <!--more-->
multipart: reverse-engineering-win95-game
carousels:
  - images: # "launching dev studio" carousel
    - image: "/images/reverse-engineering-a-win95-game-III/dev-studio-opt.png"
    - image: "/images/reverse-engineering-a-win95-game-III/open-workspace-opt.png"
     # TODO: more images
---

<!-- cSpell:words Schuster DirectX autorun pakrat -->
<!-- cSpell:ignore PAKS AMOVIE DSETUP DSETUPE DSETUPJ MATHINV SSPUNINS Bmps Ihighsco RIFFÀ -->

I recently rediscovered an obscure 1997 Simon & Schuster / Marshall Media edutainment game for Windows 95 that I played
as a kid: [Math Invaders](https://archive.org/details/MathInvaders). In this part, we'll investigate whether we can
enter an "editor mode", hinted at within the `strings` contained within the program. There's even a
✨<span class="shimmer">surprise ending</span>✨ that I didn't even see coming!

<!--more-->
---

Here's where we left off, investigating the disassembly of a function that references a mysterious string:
`*** EDITOR MODE ***`.

```c
if (gFullscreen == 0) {
	if (*(int *)(param_1 + 0x334) == 0) {
		_sprintf(local_104,s__Math_Invaders_-_NO_ACTIVE_LEVEL_0049585c);
	} else {
		__splitpath(&DAT_0049c7c8,local_1fc,local_1f4,local_12c,local_10c);
		_sprintf(local_104,s__Math_Invaders_-_'%s'_004957f4,local_12c);
		if (*(int *)(param_1 + 0x3714) == 0) {
			FID_conflict:_strcat(local_104,s__-_***_EDITOR_MODE_***_00495810);
		}
		iVar1 = CSplitterWnd::IsTracking((CSplitterWnd *)(param_1 + 0x2e0));
		if (iVar1 == 0) {
			FID_conflict:_strcat(local_104,s__-_Running..._0049584c);
		} else {
			FID_conflict:_strcat(local_104,s__-_Paused,_press_'p'_to_resume._00495828);
		}
	}
	CWnd::SetWindowTextA(param_1,local_104);
}
```

Cleaning this up and commenting to be a bit to be more readable:

```cpp
// Because `param_1` (which we'll assume is `this`) is passed to
// `CWnd::SetWindowTextA` at the end of the disassembly above,
// we can assume this function belongs to a class inheriting `CWnd`.
class CGameWnd : public CWnd;

void CGameWnd::_updateWindowTitle() {
	// Don't do anything if we're in fullscreen mode.
	if (gFullscreen) return;

	// We're going to write a window title into this buffer.
	char buffer[256];

	if (this->unknown_334 == 0) {
		// If the variable at offset 0x334 is 0/FALSE/NULL, we don't have a level loaded.
		_sprintf(buffer, "  Math Invaders - NO ACTIVE LEVEL");
	} else {
		// Split a file path stored in global 0x49c7c8, we'll call it `gFilePath`.
		char drive[5], directory[256], name[256], extension[256];
		__splitpath(gFilePath, drive, directory, name, extension);

		// Use the file name in the title
		_sprintf(buffer, "  Math Invaders - '%s'  ", name);

		if (this->unknown_3714 == 0) {
			// If the variable at offset 0x3714 is 0/FALSE/NULL, we're in
			// "editor mode"... whatever that is!

			// Append text indicating this to the buffer.
			strcat(buffer, " - *** EDITOR MODE ***");
		}

		// Check if the CSplitterWnd at 0x2e0 is "tracking" (being moved).
		// I think this might be poor disassembly on Ghidra's part, because I
		// don't see a CSplitterWnd being added at runtime, and this actually
		// switches when we press the 'p' key ("Pause", in the game's manual).
		CSplitterWnd *splitter = this->unknown_2e0;
		if (splitter->IsTracking()) {
			// If we're "tracking", append that we're paused to the buffer.
			strcat(buffer, " - Paused, Press 'p' to resume.");
		} else {
			// Otherwise, append that we're running.
			strcat(buffer, " - Running...");
		}
	}

	// Set the window title to the contents of the buffer.
	this->SetWindowTextA(buffer);
}
```

Ok! So to activate editor mode, we need to 1) not be fullscreen, 2) have `CGameWnd->unknown_334` be non-zero, and 3)
have `CGameWnd->unknown_3714` be zero. Enabling fullscreen (via the <samp>3d.ini</samp> file described in the last part)
no longer seems to crash my game (that must have been a mistake of mine!). The game starts and plays in fullscreen, and
the title even updates between "Paused, Press 'p' to resume." and "Running..." when we press <kbd>P</kbd>!

<div markdown="1">

<aside markdown=1>

While I could use a debugger to change the value at runtime, this is the only place the value is read, so we can assume
that any editor mode functionality has also been stripped out via `#ifdef EDTIOR`...

</aside>

But try as I might, <span class="aside-attn">no amount of reverse engineering is allowing me to toggle the
`unknown_3714` variable</span>. No code even exists (that I can find) to change it, except during initialization or
loading of levels, when it's always set to `TRUE`. So I have a theory: there *was* an editor mode, but its functionality
has been "removed", behind something like so:

</div>

```cpp
// Forgive my pseudo-code!
void CGameWnd::FooBarProcessInput() {
	if (IsKeyPressed('p'))
		this->isPaused = !this->g_isPaused;
	/* ✂️ ...other input handling here... ✂️ */

	// A preprocessor definition strips out any code from
	// here to `#endif` if `EDITOR` is not defined!
#ifdef EDITOR
	if (IsKeyPressed('e')) {
		// Our mysterious `unknown_3714`:
		this->isEditing = !this->isEditing;
	}
#endif
}
```

Well then! Without a deus ex machina, it looks like we'll never break into the "editor mode". I reached out to the
community to see if anyone knew more about the game itself, or had heard of a source code leak for this nearly 30 year
old game. A few people were even so kind as to search Usenet for me. But nothing was turning up. A few months passed and
I'd pretty much given up on ever finishing this part III post.

Then, out of nowhere, I received an encrypted message, sent to the SimpleX address listed in my website footer. It
didn't contain much more than a Freenet hash:

<div class="chat">
	<div class="bubble from-them"><q>You could try downloading this SSK@<span class="blur">YoUTHinkYOUrecLeVeRdONtYou?</span>/SSPYTH.zip</q></div>
	<div class="bubble from-them"><q>Its password seems to be the file name.</q></div>
</div>

I hurriedly installed Freenet and accessed the hash. The file downloaded. The password worked. And inside? <span
class="shimmer"> Beautiful, wonderful source code</span>, with "last modified" dates ranging from *December 1995 to
January 1997*!

## [Vindication!](https://c.tenor.com/vV7u0Ur7I0YAAAAd/tenor.gif){:target="_blank" referrerpolicy="no-referrer"}

First and foremost, there are indeed several instances of `#ifdef EDITOR` that block the "Editor Mode" from being used,
as I suspected! In fact, editor mode is implemented as a completely separate static library, that is only linked into
the executable when editor mode is to be used. No wonder none of the relevant code can be found when reverse engineering
the released binary!

Now that we have source code and can fully analyze the game in the ground truth, let's poke around and see what we can
find. The source code is laid out as follows:

* 📁 <samp>3DLIB</samp> - *The core 3D engine.*
  * 📄 *Various Assembly, and C++ source and header files.*
* 📁 <samp>EditLib</samp> - *Editor Mode functionality.*
  * 📄 *Various C++ source and header files.*
* 📁 <samp>RES</samp> - *The game icon in BMP and ICO formats.*
* 🔨 *Various Microsoft Developer Studio (Visual C++) files.*
* 📄 *Various C++ source and header files.*
* 📄 *Some example save files.*
* ⚙️ <samp>SSPYTH.EXE</samp> - *A compiled binary.*
* 🔧 <samp>3D.INI</samp> - *An example configuration file.*

### Cheat Codes

<div markdown=1>

<aside markdown=1>

A little more digging in Ghidra and I would have found them, as they print certain messages when activated and these
messages are visible as strings in the binary (even the unused codes!).

</aside>

<span class="aside-attn">The game has a few cheat codes!</span> They can be activated by typing the code in during play,
as it keeps a buffer of the last 20 key presses. All cheat codes begin with <kbd>K</kbd> and are committed with
<kbd>L</kbd>:

</div>

<div markdown=1>

<aside markdown=1>

The strings `Add Key`, `Add Everything`, and `Problem Debug Mode %s` do actually exist in the release binary, but the
code to activate them (as well as the `KHJ#L` code) is not present. The source code I have does not have any mechanism
to remove it (e.g., a preprocessor directive), so my assumption is that some of the cheat codes were removed from the
"final" build of the game, but that these changes were not committed to the version of the source code I have access to.

</aside>

| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Cheat&nbsp;Code | Message | Description |
|-----------------------:|:-------:|:------------|
| <span class="aside-attn"><kbd><kbd>K</kbd><kbd>E</kbd><kbd>Y</kbd><kbd>1-4</kbd><kbd>L</kbd></kbd></span> | <samp>Add Key</samp> | Gives the specified key (1-4). |
| <kbd><kbd>K</kbd><kbd>W</kbd><kbd>N</kbd><kbd>0-9</kbd><kbd>L</kbd></kbd> | <samp>Add Weapon</samp> | Gives the specified weapon (0-9) with max ammo. |
| <kbd><kbd>K</kbd><kbd>V</kbd><kbd>U</kbd><kbd>R</kbd><kbd>L</kbd></kbd> | <samp>Add Strength, Shield</samp> | Sets max strength, max shield, and dons the spacesuit. |
| <span class="aside-attn"><kbd><kbd>K</kbd><kbd>H</kbd><kbd>J</kbd><kbd>1-6</kbd><kbd>L</kbd></kbd></span> | *None* | Gives the specified item (1-6), however items 2, 3, and 6 are not allowed to be given via this cheat.<br/>The items 1-6 are: "health pack", "light divider", "time warper", "drainer field", "ultra drainer field," and "reflection". |
| <span class="aside-attn"><kbd><kbd>K</kbd><kbd>Y</kbd><kbd>H</kbd><kbd>R</kbd><kbd>L</kbd></kbd></span> | <samp>Add Everything</samp> | Adds all keys, weapons, and allowed items. |
| <span class="aside-attn"><kbd><kbd>K</kbd><kbd>N</kbd><kbd>N</kbd><kbd>L</kbd></kbd></span> | <samp>Problem Debug Mode ON</samp><br/><samp>Problem Debug Mode OFF</samp> | Toggles a mode in which math problems' expected answers are printed. |
| <kbd><kbd>K</kbd><kbd>01-27</kbd><kbd>L</kbd></kbd> | *None* | Go to level 01-27. |

</div>

### Editor Mode

Of course, the pièces de résistance of having access to the source code: editor mode! Let's see what it takes to get it
working. First, we'll need to get the source code building. Thanks to the lovely project [DOSBox-X][dbx], emulating
older Windows operating systems is as simple as following [a guide][w95dbx]. I also sourced the following disk images:
[Windows 95 OSR2][w95osr2][^osr2], [Visual C++ 4.2][vcpp42], the [DirectX 1.0 SDK][dxsdk], and the
[ActiveMovie SDK][netcd][^amalt] (this disk contains many other interesting installers as well). If you're planning on
building up such a virtual machine yourself, you'll have to find your own product keys, sorry.

[dbx]: https://dosbox-x.com/
[w95dbx]: https://dosbox-x.com/wiki/Guide%3AInstalling-Windows-95
[w95osr2]: https://archive.org/details/win-95-osr-2
[vcpp42]: https://winworldpc.com/product/visual-c/4x
[dxsdk]: https://archive.org/details/gamesdk
[netcd]: https://archive.org/details/the-net-cd
[^osr2]: The [3rd release of Windows 95](https://en.wikipedia.org/wiki/Windows_95#Editions), "OEM Release 2", added support for FAT32 drives.
[^amalt]: Alternative source in disk 4 of [Storm #1 - Internet Archive](https://archive.org/details/storm-1).

Breezing through the guide leaves us with a fully functional Windows 95 install, with Visual C++ 4.2 (which includes the
Microsoft Developer Studio IDE - which we'll need), the DirectX SDK, and the ActiveMovie SDK. Our source code contains
an `.mdp` file, which is a Developer Studio project, so let's open it!

<!-- ![Starting Microsoft Developer Studio]({{ "/images/reverse-engineering-a-win95-game-III/dev-studio.png" | absolute_url }}) -->

{% include carousel.html height="460" unit="px" number="1" %}

Let's build the default project with <kbd><kbd>Ctrl</kbd>+<kbd>B</kbd></kbd>.

```log
<output>
```

Alright, some errors, but nothing we can't solve. The first thing we notice is we're missing a file
<samp>3DLIB\DECOMP.CPP</samp>. Poking around, we find there's a file named <samp>3DLIB\aviDECOMP.CPP</samp>. A simple
file rename gets us past this error. Re-running the build gives us another error, now in the linking process. It can't
seem to find the 3DLib and ActiveMovie libraries. That's as easy as adding the full path to the ActiveMovie SDK's
<samp>lib\StrmBase.lib</samp> file and the 3DLib output file to the linker properties. Our project now builds, and we
can verify that the game runs! Well, it tells us <samp>Game not installed, run the setup program.</samp>, but commenting
out a few lines in `CSspythApp::InitInstance()` fixes that. Installing the game and pointing the `pakpath` setting in
<samp>3D.INI</samp> to the install directory allows the game to load assets and run! <!--details-->

So what do we need to enable editor mode? Let's create a new build configuration just for this use case. We already know
we have to add `/D EDITOR` to the compiler settings, and doing so builds... and fails. Why now?

```log
<output>
```

Ah, EditLib! Let's add that to our linker options as well and try again. <!--details--> This time the build succeeds and
we can run the game as before. Now, how do we activate it? We know so far that: 1) the game has to be in windowed mode,
so we set `fullscreen=0` in <samp>3D.INI</samp>; 2) there are some mystery values in the main window class that must be
set just-so to be "in editor mode". Thankfully now we can look at actual code! It turns out our
`CGameWnd::_updateWindowTitle()` decompilation above is actually named `CMainFrame::ShowPauseState()`:

```c++
void CMainFrame::ShowPauseState(void)
{
	if (g_FullScreen)
		return;

	char buffer[256];
	if (m_game.m_pscene != NULL) {
		char drive[5],directory[200], name[30], extension[5];
		_splitpath(FileName, drive, directory, name, extension);
		sprintf(buffer, "  S.S. Pythagoras  -  '%s'  ", name);
		if (!m_game.m_GameMode)
			strcat(buffer, " - *** EDITOR MODE ***");
		if (m_game.Paused())
			strcat(buffer, " - Paused,  press 'p' to resume.");
		else
			strcat(buffer, " - Running...");
	} else {
		sprintf(buffer, "  S.S. Pythagoras  -  NO ACTIVE LEVEL");
	}

	SetWindowText(buffer);
}
```

Awesome, my guesses were *really* close. `unknown_334` is `m_game.m_pscene`, and `unknown_3714` is `m_game.m_GameMode`.
Let's see if I'm right, and `m_GameMode` is changed with a `#ifdef EDITOR`-surrounded key input. `m_GameMode` is only
changed in two places in the code, both in <samp>GAME.CPP</samp>. The first is during initialization, where it is set to
`TRUE`. The second place is further down the file, in `CGame::Update(CKeyboard&)`:

```c++
// ✂️ snip unrelated code ✂️ //

if (keys.KeyDownWasUp('G'))	{
	m_GameMode = !m_GameMode;
	GetMainFrame()->ShowPauseState();
}

// ✂️ snip unrelated code ✂️ //
```

Ok, this isn't surrounded by `#ifdef EDITOR`... I suspect again that the "final" version of the game saw a few code
changes that weren't included in the copy of the code I have. But a little digging shows that `m_GameMode` alone has no
real effect, because just a little further down is the code to actually *perform* editor mode:

```c++
/////////////////////////////////////////// EDITOR
#ifdef EDITOR
if (!g_FullScreen  &&  !m_GameMode) {
	if (keys.KeyDownWasUp('I')) {
		GetApp()->ShowEditFrame();
		GetApp()->m_editframe->OnInsertButton();
	} else if (edit_object) {
		// ✂️ snip unrelated code ✂️ //
	}
}
#endif
```

<div markdown=1>

<aside markdown=1>

I've skipped over some steps I had to take related to the release version PAK files referencing unused &mdash; and
unincluded &mdash; textures and models. I suspect the released game runs fine without them because it only loads used
textures, while the editor mode loads all textures (in case you want to use them) that are defined. As I don't have the
original game assets (I only have source code and the PAK files distributed with the released game) I can't recover
these textures and models, and so I just copied existing files and gave them the expected name.

Another item of interest is that in activating editor mode *no* textures will load properly, as the files on-disk are
expected to be [PCX](https://en.wikipedia.org/wiki/PCX) format, but when packing a PAK file the raw data is stored
unencoded (likely to increase loading speed). My extractor from Part I, PAKrat, just extracts the raw data into the
specified file path, leaving me with invalid PCX files. The actual format, as stored in the PAK, is like so:

```c
struct {
  // Width and height of the data:
  int columns, rows;
  // The data itself (pretend C supports this):
  unsigned char[columns * rows];
  // The width, height, and x-y offset
  // of the desired sub-image:
  int width, height, offset_x, offset_y;
};
```

</aside>

<div markdown=1>

So, we need to press <kbd>G</kbd> to switch the game mode, and then <kbd>I</kbd> (I suspect for **I**nsert or
**I**nspect) <span class="aside-attn">will show the editor controls</span>! Once editor mode is active you can also
press <kbd>E</kbd> to **E**dit door and entity instances, or <kbd>T</kbd> to edit the focused object's **T**ype. Let's
give it a go:

{% capture editor_mode %}{{ "/images/reverse-engineering-a-win95-game-III/editor-mode-opt.png" | absolute_url }}{% endcapture %}
{% capture editor_mode_thumb %}{{ "/images/reverse-engineering-a-win95-game-III/editor-mode-thumb.png" | absolute_url }}{% endcapture %}
{% include popimg.html src=editor_mode thumb=editor_mode_thumb alt="Editor Mode" %}

</div>

</div>

<!-- ## Next Steps -->
