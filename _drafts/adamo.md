---
layout: post
title: "Exploring the Dell Adamo XPS"
subtitle: "“World's Thinnest Laptop”"
tags: [retrocomputing]
author: Sidneys1
image: /images/adamo-xps/hero.jpg
image_shadow: false
image_float: true
# toc: false
# mastodon_comment_url:
# cSpell:words Adamo businesspeople chicklet chipset
---

Adamo: Latin for *"to fall in love with"*. The Dell Adamo XPS was (and perhaps still is) the world's thinnest laptop,
measuring 9.9mm at its thickest point. It achieves this through some weird but clever engineering. After almost two
years of having an eBay search alert, I finally have my hands on one. Let's take a look at this strange but beautiful
machine.

<!--more-->

Released on November 5<sup>th</sup>, 2009, the Adamo XPS was Dell's follow-up to the original "world's thinnest laptop",
the Adamo 13. Featuring a clever new hinge design, the Adamo XPS was immediately touted by reviews as impressively
engineered, but overpriced and underwhelming in almost every other aspect.

I had previously owned this laptop in college, toting it to classes for note-taking. At some point, I lent it to a
girlfriend who "lost" it when we broke up, and I've been trying to get my hands on another one ever since. Due to the
hefty price ($1,799 USD at launch), poor reviews, and short window of availability (four months between November 2009
and March 2010) this laptop is *extremely rare*. I set up an eBay search alert almost two years ago, and listing after
listing turned up nothing more substantial than parts.

<div markdown="1">

Finally, in December of 2024 a working Adamo XPS was listed for $139.99 plus $30 shipping from Texas! I immediately
snatched it up and by early January 2025 it was in my hands. It does indeed work, though the battery no longer charges.
I immediately set about wiping the hard drive, <span class="aside-attn">reinstalling Windows 7 Pro SP1 x64</span>,
installing Dell's drivers, and getting all of the software up to date[^1].

<aside markdown="1">

I accidentally installed Windows 7 Pro SP1 **x86** the first time! I got through the entire install before realize my
mistake when the Dell drivers wouldn't install.

</aside>

</div>

Physically the laptop feels a bit flimsy, perhaps to be expected with how thin it is, and while sleek the build quality
is perhaps lower than to be expected, considering the Adamo line was targeted at elite executives. Some of the body
seams are ill-fitting and the rubber feet sometimes pop out of place. When closed, the device is fairly nondescript: a
slate-gray chassis featuring"D<span style="display:inline-block;padding:0 0.1em;transform:rotate(-45deg) scaleX(1.5);">E</span>LL | adamo<sub>xps</sub>" with a small groove at the "top" near a small LED indicator bar, and a
constrained selection of ports (two USB-A ports, a DisplayPort, a headphone jack, and a power jack). On the bottom there
is similarly not much to see beyond a Dell logo, some ventilation and audio grilles, and the toggle for the removable
battery.

In fact, it's not even immediately obvious how to open the laptop. Lifting the top of the screen as one would normally
just lifts the entire device into the air. Instead, you have to slide you finger across the groove at the top of the
device -- as you do so, the LED bar lights up in response, and with a soft click the "body" is released and you may lift
the screen up.

![Adamo XPS hinge]({{ '/images/adamo-xps/hinge.jpg' | absolute_url }}){:style="float:left;margin-right:1em;box-shadow:none !important;"}

As you do, the body/keyboard extends from within the screen bezel where it has been nestled and extends up at an angle,
as the screen and body hinge away from the edge, the bottom of the screen portion acting almost like a kickstand. It's
almost difficult to explain how the hinging works, so I've included a photo. Once open, we find a fairly standard
Synaptic touchpad and a chicklet keyboard, although <kbd>Esc</kbd> and <kbd>F1</kbd>-<kbd>F12</kbd> sit on a row of
flush buttons above the keyboard and are duplexed with <kbd>Fn</kbd> combinations -- one of which is, perplexingly,
"<kbd>&#x23cf;</kbd>", despite the Adamo XPS having no ejectable ports or drives. There are a few speaker grilles in
both the screen bezel and the keyboard/body, and the webcam (previously on the "bottom" of the closed laptop) is now
prominently above the display.

Pressing the power button -- for me -- produced several POST beeps, as the battery pack has gone bad, and the BIOS does
not like this. Interestingly, the LED bar on the top of the device also blinked the POST beeps in red, which is actually
quite a nice feature. Pressing <kbd>F1</kbd> (or removing the battery) allows me to continue to Windows.

Windows Experience Index produces a measly 3.2, held back by the lackluster Mobile Intel 4 Series Express Chipset
providing graphics capabilities, though thankfully Windows Aero does work on this device. The highest score comes from
the solid state drive, unsurprising as that component is fairly high quality for 2009.

<details markdown="1"><summary>Expand <a href="https://crystalmark.info/en/software/crystaldiskmark/" target="_blank">CrystalDiskMark</a> (in SSD+Peak Performance mode) report</summary>

|                                Test |         Read |        Write |
|------------------------------------:|-------------:|-------------:|
|         Sequential (SEQ1M Q8T1[^2]) |  211.00 MB/s |  157.28 MB/s |
|               Random (RND4K Q32T16) |   11.42 MB/s |    6.89 MB/s |
|               Random (RND4K Q32T16) | 2787.84 IOPS | 1682.86 IOPS |
| Random (RND4K Q32T16) Response time |     104.48ms |     140.57ms |

Of course, these results pale in comparison to modern solid state drives; the M.2 drive in my desktop reports 3.56/1.47 GB/s sequential reads/writes, and 284k/417k read/write IOPS.
{:.slight}

</details>

<!--
Steps so far:
1. Installed Windows 7 SP1 x64
2. Installed all applicable Dell drivers ([Support for Adamo XPS \| Drivers & Downloads \| Dell US][dell-drivers]).
3. Ran [LegacyUpdate][legacy-update].

[dell-drivers]: https://www.dell.com/support/product-details/en-us/product/adamo-xps/drivers
[legacy-update]: https://legacyupdate.net
-->

## Fact Sheet
{:style="clear:both;"}

|              Name | Description                                                                                      |
|------------------:|:-------------------------------------------------------------------------------------------------|
|  **Release Date** | November 5<sup>th</sup>, 2009[^3]                                                                |
|  **Discontinued** | March 2010 *(four months after release)*{:.slight}                                               |
| **Release Price** | $1,799 USD *($2,624 in 2024 USD[^4], a 46% increase due to inflation)*{:.slight}                 |
|-------------------|--------------------------------------------------------------------------------------------------|
|    **Dimensions** | 273.9mm × 333.9mm × 9.9mm[^5] *(10.78in × 13.15in × 0.39in)*{:.slight}                           |
|        **Weight** | 121g *(4.27oz)*{:.slight}                                                                        |
|-------------------|--------------------------------------------------------------------------------------------------|
|           **CPU** | [Intel Core 2 Duo U9400][cpu]{:target="_blank"} *(64-bit, 45nm, dual-core, 1.4Ghz)*{:.slight}    |
|           **RAM** | 4GB Dual-channel 800Mhz DDR3 SDRAM                                                               |
|       **Storage** | Samsung PM800 128GB SSD                                                                          |
|       **Display** | 13.4in WLED at 1366x768 pixels                                                                   |
|         **Power** | Removable 20Wh Li-ion delivering 4-5 hours of run time, plus a 45W power supply                  |
|         **Ports** | Left: USB-A, DisplayPort. Right: 3.5mm audio, USB-A, power supply                                |
|  **Connectivity** | Bluetooth 2.1, Intel WiFi Link 5300 AGN *(802.11a/b/g/Draft-N)*{:.slight}                        |
|   **Peripherals** | 2 megapixel webcam, Synaptics touchpad, various media control keys composed over the F-keys      |
|-------------------|--------------------------------------------------------------------------------------------------|
| **Windows Experience Index** | 3.2 *(Processor: 4.2, Memory: 4.9, Graphics: **3.2**, Gaming Graphics: **3.2**, Primary Hard Disk: 6.9)*{:.slight} |

[cpu]: https://www.intel.com/content/www/us/en/products/sku/36697/intel-core2-duo-processor-su9400-3m-cache-1-40-ghz-800-mhz-fsb/specifications.html

[^1]: [Legacy Update](https://legacyupdate.net){:target="_blank"} was invaluable here to get Windows updates installed
      quickly and efficiently.

[^2]: Decoding CrystalDiskMark test names:

      SEQ1M/RND128K
      : Sequential or random reads and writes (here: sequential 1 megabyte / random 128 kilobytes).

      Q32T16
      : Specified number of I/O queues and threads (here: 32 queues, 16 threads).

[^3]: [Dell Adamo - §Adamo XPS - Wikipedia](https://en.wikipedia.org/wiki/Dell_Adamo#Adamo_XPS){:target="_blank"}
[^4]: [U.S. Bureau of Labor Statistics Consumer Price Index Inflation Calculator](https://www.bls.gov/data/inflation_calculator.htm){:target="_blank"}
[^5]: [Product Safety, EMC and Environmental Datasheet](https://web.archive.org/web/20110416094003/http://www.dell.com/downloads/global/corporate/environ/comply/adamo_xps_9_p02s001.pdf){:target="_blank"}
