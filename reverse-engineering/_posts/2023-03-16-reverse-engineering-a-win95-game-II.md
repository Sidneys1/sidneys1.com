---
layout: post
title:  "Reverse Engineering a Windows 95 Game"
subtitle: "Reversing (Undocumented) Settings"
categories: [reverse-engineering]
tags: [programming, reverse-engineering, ghidra]
author: Sidneys1
image: images/reverse-engineering-a-win95-game-II/hero.png
image_shadow: false
toc: false
excerpt_separator: <!--more-->
multipart: reverse-engineering-win95-game
kramdown:
  syntax_highlighter_opts:
    block:
      line_numbers: true
mastodon_comment_url: https://infosec.exchange/@Sidneys1/110035116373587702
---

<!-- cSpell:words Schuster DirectX autorun Ghidra -->
<!-- cSpell:ignore sspyth MATHINV mbscpy strcmp -->

I recently rediscovered an obscure 1997 Simon & Schuster / Marshall Media edutainment game for Windows 95 that I played
as a kid: [Math Invaders](https://archive.org/details/MathInvaders). In this part, we'll investigate disassembling and
reverse engineering the binary to identify an undocumented settings file format.

<!--more-->
---

As our reverse engineering tool of choice, we'll be using the National Security Agency's
[Ghidra](https://ghidra-sre.org/). This powerful tool allows us to disassemble the `MATHINV.EX_` binary that is bundled
on the disk. The first bit of information we get when ingesting the binary in Ghidra is an "Import Results Summary"
dialog, with information about the binary itself. Here's some excerpts:

```
Compiler:                     visualstudio:unknown
Debug Misc:                   Release/sspyth.exe
PDB File:                     sspyth.pdb
PE Property[FileDescription]: SSPYTH MFC Application
```

Interesting - the project in visual studio seems to have originally been called "sspyth", short for "S.S. Pythagoras",
the name of the protagonist's ship within the game. Let's try and identify the entrypoint. This is a Windows MFC program,
which means the actual entrypoint is "runtime code" that will identify the main MFC module within the program and
initialize it. So instead of looking for this entrypoint (which Ghidra finds for us and names `entry`), we will try and
find the main MFC module initializer by searching for something we know happens early in the program's execution.

When first run, the game checks that DirectX, DirectPlay, and the game CD are inserted. Using Ghidra's <kbd>Search</kbd>
&rarr; <kbd>For Strings...</kbd> tool we'll find the "Please insert CD" message.

![string search]({{ '/images/reverse-engineering-a-win95-game-II/string-search.png' | absolute_url }})

Clicking the result will select the data in the CodeBrowser, and right-clicking the automatically created symbol allows
us to click <kbd>References</kbd> &rarr; <kbd>Find references to s_Please_insert...</kbd> to find all references to this
particular value within the codebase. Doing so brings up one result at 0x0042cb86. Clicking the result takes us to the
relevant address. The disassembly shows us a function called `FUN_0042ca2f(CWinApp *param_1)`, which we'll renamed to
`CWinAppEntrypoint`. As this function is not called anywhere else in the code, we can be fairly confident that this is
only called by runtime code that gets its address programmatically.

<details markdown="1">
<summary>Disassembly of <code>CWinAppEntrypoint</code> (click to expand).</summary>

```c
void CWinAppEntrypoint(CWinApp *param_1) {
  int iVar1;
  undefined4 *puVar2;
  FILE *_File;
  undefined4 local_28c;
  BYTE local_21c [264];
  char local_114 [260];
  void *pvStack_10;
  undefined *puStack_c;
  undefined4 local_8;

  local_8 = 0xffffffff;
  puStack_c = &LAB_0042cc3d;
  pvStack_10 = ExceptionList;
  ExceptionList = &pvStack_10;
  CWinApp::Enable3dControlsStatic(param_1);
  CWinApp::LoadStdProfileSettings(param_1,4);
  FID_conflict:__mbscpy((char *)local_21c,&DAT_00495378);
  FUN_0042d603(s_Version_0049537c,local_21c);
  iVar1 = _strcmp(s_1.00-Rel_00495384,(char *)local_21c);
  if (iVar1 != 0) {
    AfxMessageBox(s_Game_not_installed,_run_the_setu_00495390,0x10,0);
    FUN_0042cc47();
    return;
  }
  FID_conflict:__mbscpy((char *)local_21c,&DAT_004953bc);
  FID_conflict:__mbscpy(local_114,&DAT_004953c0);
  GetPrivateProfileStringA
            (s_MazePath_004953dc,s_pakpath_004953d4,&DAT_004953d0,local_114,0x104,
             s_.\3d.ini_004953c4);
  puVar2 = (undefined4 *)_strlen(local_114);
  if (puVar2 == (undefined4 *)0x0) {
    FUN_0042d603(s_pakpath_004953e8,local_21c);
    FID_conflict:_strcat((char *)local_21c,s_game.pak_004953f0);
    while (_File = FID_conflict:__wfopen((char *)local_21c,&DAT_004953fc), _File == (FILE *)0x0)  {
      iVar1 = AfxMessageBox(s_Please_insert_the_Math_Invaders_C_00495400,0x11,0);
      if (iVar1 == 2) {
        FUN_0042cc47();
        return;
      }
    }
    puVar2 = (undefined4 *)_fclose(_File);
  }
  AfxSetAllocStop(0x53b0);
  local_8 = 0;
  if (puVar2 == (undefined4 *)0x0) {
    local_28c = 0;
  }
  else {
    local_28c = FUN_0042e186(puVar2);
  }
  local_8 = 0xffffffff;
  *(undefined4 *)(param_1 + 0x1c) = local_28c;
  FUN_0042e2e0(*(int **)(param_1 + 0x1c));
  FUN_0042cc47();
  return;
}
```

</details>

Alright! We can already see some useful things here. `FUN_0042d603` gets a value from the game's Registry key, so that
line just checks that the program is installed. In fact, we can just rename `FUN_0042d603` to `GetValueFromRegistry`.
Further down we see a `GetPrivateProfileStringA ` call. I had to look this function up as it's somewhat esoteric, but it
and the whole `GetPrivateProfile*` still supported in today's Win32 API!

> Retrieves a string from the specified section in an initialization file.
> <cite>[`GetPrivateProfileStringA` function (`winbase.h`) - Win32 apps | Microsoft Learn][prof-string-a]</cite>

This description undersells this singular function call - when called the `GetPrivateProfileXxx` family of APIs will
open and read a given `*.ini` file, parse it, and return the value in the specified `[section]` and `key=`. If the given
file does not exist, it will return the default value.

And, using Ghidra's Symbol Tree, we can find all calls to the `GetPrivateProfileXxx` APIs and the parameters used. Doing
so provides us with this list of parameters, expected to be found in `.\3d.ini` (relative to the CWD). These are mostly
loaded in another function called by `CWinAppEntrypoint`: `FUN_0042e2e0`, which we can rename to `LoadSettings`:

```ini
[MazePath]
pakpath =       ; String
datapath =      ; String
diskpath =      ; String
lastfile =      ; String
room =          ; String
usepakfile = 0  ; Integer. In practice it is used as a boolean,
                ; where 0 is FALSE, and anything else is TRUE.

[Render]
fullscreen = 1  ; Integer
winsize = 10    ; Integer
textdetail = 10 ; Integer
```

Let's see if this works. Let's just create a `C:\MathInvaders\3d.ini` and as a simple test, we'll set
`[Render]`&rarr;`fullscreen` to `0`, and...

![It works! ...sorta.]({{ '/images/reverse-engineering-a-win95-game-II/guest%20os_000.png' | absolute_url }})

Well... Sort of. Ok, the game doesn't actually run, and there's a weird white space at the bottom of the window. But
we've proven it works! But what's intriguing to me is the `[MazePath]` section of the config... I wonder what we could
use *those* settings for. In particular, the `fullscreen` setting is loaded into a global variable that we'll call
`gFullscreen` - this factors into to code processing some very interesting strings about an "editor mode"... I wonder
if we can activate that?

```c
if (gFullscreen == 0) {
	if (*(int *)(param_1 + 0x334) == 0) {
		_sprintf(local_104,s__Math_Invaders_-_NO_ACTIVE_LEVEL_0049585c);
	}
	else {
		__splitpath(&DAT_0049c7c8,local_1fc,local_1f4,local_12c,local_10c);
		_sprintf(local_104,s__Math_Invaders_-_'%s'_004957f4,local_12c);
		if (*(int *)(param_1 + 0x3714) == 0) {
			FID_conflict:_strcat(local_104,s__-_***_EDITOR_MODE_***_00495810);
		}
		iVar1 = CSplitterWnd::IsTracking((CSplitterWnd *)(param_1 + 0x2e0));
		if (iVar1 == 0) {
			FID_conflict:_strcat(local_104,s__-_Running..._0049584c);
		}
		else {
			FID_conflict:_strcat(local_104,s__-_Paused,_press_'p'_to_resume._00495828);
		}
	}
	CWnd::SetWindowTextA(param_1,local_104);
}
```

Next time!


<!-- References -->

[prof-string-a]: https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprivateprofilestringa
