---
layout: post
title:  "PowerShell Profile Instant Prompt"
# date:   2022-03-23 13:04:39 -0400
tags: [programming, powershell]
author: Sidneys1
# image: /images/ipfs-ethoslab-archive/hero.jpg
toc: false
excerpt_separator: <!--more-->
---

Recently I began using [Oh My Posh](https://ohmyposh.dev/) for PowerShell 7+ (pwsh). One thing I noticed however is that
it takes upward of a second to activate in my pwsh `$profile`. Let's dig in and see if we can't improve that.

<!--more-->

First, let's establish a baseline - after [installing Oh My Posh](https://ohmyposh.dev/docs/installation/windows) (say,
with WinGet) we're instructed to add the line `oh-my-posh init pwsh | Invoke-Expression` to our pwsh `$profile`. We can
investigate the cost of this with a handy pwsh package `PSProfiler`:

```powershell
Install-Module PSProfiler;
& pwsh.exe -NoProfile -Command {Import-Module PSProfiler; Measure-Script $profile;}

# Count  Line       Time Taken Statement
# -----  ----       ---------- ---------
#     1     1    00:00.0734463 Import-Module PSReadLine;
#     1     2    00:00.0234282 Set-PSReadLineOption -EditMode Windows
#     1     3    00:00.0011258 Set-PSReadLineOption -PredictionSource HistoryAndPlugin
#     1     4    00:00.0016107 Set-PSReadLineOption -PredictionViewStyle InlineView
#     0     5    00:00.0000000
#     1     6    00:00.3770726 oh-my-posh init pwsh | Invoke-Expression
#     1     7    00:00.0005995 Enable-PoshTransientPrompt
#     1     8    00:00.0005577 Enable-PoshLineError
```

You can see that out of all the commands I have in my profile, oh-my-posh init is taking an order of magnitude longer
than the others. When my system is under load and I _really need that terminal now_, this causes friction. Let's see
what exactly `oh-my-posh init pwsh` is outputting that gets interpreted by `Invoke-Expression` (note that I've inserted
`%LOCALAPPDATA%` and `<some config path>` for brevity):

```powershell
oh-my-posh init pwsh
# (@(& '%LOCALAPPDATA%/Programs/oh-my-posh/bin/oh-my-posh.exe' init pwsh --config='<some config path>' --print) -join "`n") | Invoke-Expression
```

It looks like it just calls itself again! We can skip that first step entirely by just copy-and-pasting this output into
our original profile. Let's measure things again now that we've made this change:

```powershell
& pwsh.exe -NoProfile -Command {Import-Module PSProfiler; Measure-Script $profile;}

# Count  Line       Time Taken Statement
# -----  ----       ---------- ---------
#     1     1    00:00.0790705 Import-Module PSReadLine;
#     1     2    00:00.0279149 Set-PSReadLineOption -EditMode Windows
#     1     3    00:00.0010231 Set-PSReadLineOption -PredictionSource HistoryAndPlugin
#     1     4    00:00.0011608 Set-PSReadLineOption -PredictionViewStyle InlineView
#     0     5    00:00.0000000
#     2     6    00:00.0694422 (@(& '%LOCALAPPDATA%/Programs/oh-my-posh init pwsh ...
#     1     7    00:00.0006244 Enable-PoshTransientPrompt
#     1     8    00:00.0005833 Enable-PoshLineError

& pwsh.exe -NoProfile -Command {Measure-Command { . $profile };}

# ...
# TotalMilliseconds : 463.3328
```

We've successfully brought our oh-my-posh invocation down an order of magnitude and shaved a couple hundred milliseconds
off of our profile initialization. But... we can do better. A cool feature of
[powerlevel10k](https://github.com/romkatv/powerlevel10k) is "instant prompt", which allows a prompt to show
immediately, even while your profile is still loading. Let's reproduce this behavior in pwsh.

```powershell
# In our $profile...
Import-Module PSReadLine;

function prompt {
  if (Test-Path variable:global:ompjob) {
    # snip
  }
  $global:ompjob = Start-Job {(@(& '%LOCALAPPDATA%/Programs/oh-my-posh/bin/oh-my-posh.exe' init pwsh --config='<some config path>' --print) -join "`n")};
  write-host -ForegroundColor Blue "Loading `$profile in the background..."
  Write-Host -ForegroundColor Green -NoNewline "  $($executionContext.SessionState.Path.CurrentLocation) ".replace($HOME, '~');
  Write-Host -ForegroundColor Red -NoNewline "ᓚᘏᗢ"
  return " ";
}
```

First, we create a new `prompt` function; unsurprisingly this is the function that pwsh calls to render your prompt. Our
custom `prompt` function will first check if there's a global variable named `ompjob` - this is going to be a background
job in which we execute oh-my-posh. The first time `prompt` runs this variable will be unset, and so our `if` will be
skipped, and I've snipped it for readability. We'll come back to it.

Now, if the variable is unset, we'll set it to a new background job that executes our `oh-my-posh` invocation, but
without the `Invoke-Expression`. This will let the job's output be the text printed by oh-my-posh that we can consume
with `Invoke-Expression` later. Finally, we print out a nice little prompt - not as fancy as `oh-my-posh`'s, but it'll
do, _and_ it'll display almost instantly.

Finally, let's fill in the `if`-block for when the global variable _is_ set (on the second invocation of `prompt`):

```powershell
Import-Module PSReadLine;

function prompt {
  if (Test-Path variable:global:ompjob) {
    Receive-Job -Wait -AutoRemoveJob -Job $global:ompjob | Invoke-Expression;
    Remove-Variable ompjob -Scope Global;
    Enable-PoshTransientPrompt
    Enable-PoshLineError

    Set-PSReadLineOption -EditMode Windows
    Set-PSReadLineOption -PredictionSource HistoryAndPlugin
    Set-PSReadLineOption -PredictionViewStyle InlineView

    [console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding
    return prompt;
  }
  # snip
}
```

First, we get the output from the `ompjob`, and we `Invoke-Expression` it. In doing so, `oh-my-posh` redefines our
`prompt` function. We'll then initialize some other settings within `PSReadLine` and `oh-my-posh`. Finally, we return
whatever `oh-my-posh` produces in its redefined `prompt` function, and we're done! Let's profile this as well:

```powershell
& pwsh.exe -NoProfile -Command {Import-Module PSProfiler; Measure-Script $profile;}

# Count  Line       Time Taken Statement
# -----  ----       ---------- ---------
#     1     1    00:00.0789758 Import-Module PSReadLine;
#     0     2    00:00.0000000
#     0     3    00:00.0000000 function prompt {
#     0     4    00:00.0000000   if (Test-Path variable:global:ompjob) {
#     0     5    00:00.0000000     Receive-Job -Wait -AutoRemoveJob -Job $global:ompjob | Invoke-Expression;
#     0     6    00:00.0000000     Remove-Variable ompjob -Scope Global;
#     0     7    00:00.0000000     Enable-PoshTransientPrompt
#     0     8    00:00.0000000     Enable-PoshLineError
#     0     9    00:00.0000000
#     0    10    00:00.0000000     Set-PSReadLineOption -EditMode Windows
#     0    11    00:00.0000000     Set-PSReadLineOption -PredictionSource HistoryAndPlugin
#     0    12    00:00.0000000     Set-PSReadLineOption -PredictionViewStyle InlineView
#     0    13    00:00.0000000
#     0    14    00:00.0000000     [console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding
#     0    15    00:00.0000000     return prompt;
#     0    16    00:00.0000000   }
#     0    17    00:00.0000000   $global:ompjob = Start-Job {(@(& '%LOCALAPPDATA%/Programs/oh-my-posh/bin/oh-my-posh.exe' init pwsh ...
#     0    18    00:00.0000000   write-host -ForegroundColor Blue "Loading `$profile in the background..."
#     0    19    00:00.0000000   Write-Host -ForegroundColor Green -NoNewline "  $($executionContext.SessionState.Path.CurrentLocation) ".replace($HOME, '~');
#     0    20    00:00.0000000   Write-Host -ForegroundColor Red -NoNewline "ᓚᘏᗢ"
#     0    21    00:00.0000000   return " ";
#     0    22    00:00.0000000 }

& pwsh.exe -NoProfile -Command {Measure-Command { . $profile };}

# ...
# TotalMilliseconds : 101.5553
```

Wow! We've almost completely eliminated the overhead of importing our profile, and pushed that execution time into the
background while a user is typing in their first prompt and digesting its output. I'd move the
`Import-Module PSReadLine` into the background as well, except that module doesn't import correctly when you do this.
