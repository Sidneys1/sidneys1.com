---
layout: post
title: Sun SPARC Journey

toc: true
excerpt_separator: <!--more-->
---

In early 2022 [I got several Sun SPARC servers][retro-roundup-2022] for free off of a FreeCycle ad. I was recently
[called out][hn-comment]{: target="_blank"} for not providing any sort of update on those devices... so here we go!

[retro-roundup-2022]: {% post_url /retrocomputing/2022-06-03-retro-roundup %}
[hn-comment]: https://news.ycombinator.com/item?id=41722918

<!-- more -->
---

## The Devices

| Name            |  Released | Original MSRP | Inflation-adjusted (2024) |
|:----------------|----------:|--------------:|:--------------------------|
| SPARCstation 20 | Mar. 1994 |       $12,195 | $26,080                   |
| Ultra 1 Creator | Nov. 1995 |       $25,995 | $53,276                   |
| Axil Ultima 1   | Sep. 1996 |        $9,995 | $19,939                   |

## NVRAM Woes

Sun SPARC machines store some of their BIOS configuration in a chip called an
<dfn><abbr title="non-volatile RAM">NVRAM</abbr></dfn>, a special type of writeable random access memory that does not
clear its contents when the machine powers off. This is usually a small RAM chip with its own internal battery that
recharges when the machine is running. Unfortunately this means that when the devices is powered off for extremely long
periods the NVRAM loses its values. Even more unfortunately, over time the NVRAM battery degrades to the point where it
can no longer be recharged, and every power cycle results in a compete configuration wipe.

Such is the case with my SPARC machines! Upon powering on we're greeted with a sad message:

<!-- <div markdown=1 style="float: right;">

```
Sun Ultra 1 UPA/SBus (UltraSPARC 167MHz), Keyboard Present
OpenBoot 3.7, 384 MB memory installed, Serial #16777215.
Ethernet address ff:ff:ff:ff:ff:ff, Host ID: ffffffff.

The IDPROM contents are invalid.
```
{: .amber-term }

</div> -->

{% include popimg.html src="/images/sparc-journey/invalid-nvram.jpg" alt="Invalid NVRAM boot messages" %}

Oh no! `Incorrect configuration checksum; Ethernet address ff:ff:ff:ff:ff:ff, Host ID: ffffffff. The IDPROM contents are invalid`{: .amber-term} means that our NVRAM has been cleared. Thankfully, there's a process in place to restore it
manually[^1] by entering NVRAM vaulues by hand.

[^1]: [SUN NVRAM/hostid FAQ](https://www.sun3arc.org/FAQ/sun-nvram-hostid.faq.phtml)

## Booting the Ultra 1

## Booting the SPARCstation 20

<!-- The SPARCstation 20 wouldn't boot (with memory check errors). -->

## Axil Ultima 1

<!-- The Axil started to boot, but then on subsequent power cycles deteriorated to the point of no longer printing any output. -->

<!--
Notes:
- https://forum.vcfed.org/index.php?threads/how-to-workaround-when-your-sun-ultra-5-10-nvram-no-longer-works.52997/
  on how to reprogram the nvram
- https://www.sun3arc.org/FAQ/sun-nvram-hostid.faq.phtml
  lots of facts, specifically the requisite first bytes of the hostid.
- http://sunsite.uakom.sk/sunworldonline/swol-11-1995/swol-11-fusion.intro.html
- https://www.edn.com/axil-launches-the-axil-ultima-1-and-axil-ultima-2-workstations-and-servers/

 -->
