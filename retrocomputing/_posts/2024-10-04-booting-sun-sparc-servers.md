---
layout: post
title: Booting Sun SPARC Servers
subtitle: Poking NVRAM like it's 1994
tags: [retrocomputing, sun-sparc]

image: /images/sparc-journey/hero.jpg
image_shadow: true
toc: true
excerpt_separator: <!--more-->
mastodon_comment_url: https://infosec.exchange/@Sidneys1/113250979290486754

carousels:
  - images:
    - image: "/images/sparc-journey/ultra-case.jpg"
    - image: "/images/sparc-journey/ultra-badge.jpg"
    - image: "/images/sparc-journey/ultra-case-open.jpg"
    - image: "/images/sparc-journey/ultra-1-shell.jpg"
  - images:
    - image: "/images/sparc-journey/sparcstation-case.jpg"
    - image: "/images/sparc-journey/sparcstation-mobo.jpg"
    - image: "/images/sparc-journey/sparcstation-cpu.jpg"
    - image: "/images/sparc-journey/sparcstation-ram.jpg"
  - images:
    - image: "/images/sparc-journey/axil-case.jpg"
    - image: "/images/sparc-journey/axil-case-open.jpg"
    - image: "/images/sparc-journey/axil-poweron-failure-1.jpg"
    - image: "/images/sparc-journey/axil-poweron-failure-2.jpg"
    - image: "/images/sparc-journey/axil-poweron-failure-3.jpg"
    - image: "/images/sparc-journey/axil-poweron-failure-4.jpg"
---

In early 2022 [I got several Sun SPARC servers][retro-roundup-2022] for free off of a FreeCycle ad: I was recently
[called out][hn-comment]{: target="_blank"} for not providing any sort of update on those devices... so here we go!

[retro-roundup-2022]: {% post_url /retrocomputing/2022-06-03-retro-roundup %}
[hn-comment]: https://news.ycombinator.com/item?id=41722918

<!--more-->

## The Devices

| Name            |  Released | Original MSRP | Inflation-adjusted (2024) |
|:----------------|----------:|--------------:|:--------------------------|
| SPARCstation 20 | Mar. 1994 |       $12,195 | $26,080                   |
| Ultra 1 Creator | Nov. 1995 |       $25,995 | $53,276                   |
| Axil Ultima 1   | Sep. 1996 |        $9,995 | $19,939                   |

## NVRAM Woes

{% include popimg.html src="/images/sparc-journey/invalid-nvram.jpg" alt="Invalid NVRAM boot messages" style="float:right; margin-left:1em;" %}

Sun SPARC machines store some of their BIOS configuration in a chip called an
<dfn><abbr title="non-volatile RAM">NVRAM</abbr></dfn>, a special type of writeable random access memory that does not
clear its contents when the machine powers off. This is usually a small RAM chip with its own internal battery that
recharges when the machine is running. Unfortunately this means that when the devices is powered off for extremely long
periods the NVRAM loses its values. Even more unfortunately, over time the NVRAM battery degrades to the point where it
can no longer be recharged, and every power cycle results in a compete configuration wipe.

Such is the case with my SPARC machines; upon powering on we're greeted with a sad message.
`Incorrect configuration checksum; Ethernet address ff:ff:ff:ff:ff:ff, Host ID: ffffffff. The IDPROM contents are invalid`{:.amber-term}
means that our NVRAM has been cleared (the term IDPROM is a historical artifact -- older Sun architectures used a
<dfn><abbr title="Programmable ROM">PROM</abbr></dfn> chip instead of an NVRAM chip). Thankfully, there's a process in
place to restore it manually by entering NVRAM values by hand. Here's the general process:

1. Boot your Sun SPARC machine. When you see the `The IDPROM contents are invalid`{: .amber-term} message, press <kbd><kbd>STOP</kbd>+<kbd>A</kbd></kbd> (<kbd>STOP</kbd> is a special key on Sun keyboards). This should drop you to the `ok`{:.amber-term} prompt, which is the OpenBoot debugging prompt.
   <!-- TODO: take photo of STOP key. -->
2. Now we're going to poke values into our NVRAM using the `mkp` command. This command has a format `<value> <location> mkp`. Here's the layout of NVRAM, or at least the parts we care about:

   | Location(s) | Description                                                             |
   |------------:|-------------------------------------------------------------------------|
   |           0 | Always `1` (format/version number).                                     |
   |           1 | First byte of HostID (machine type[^1]).                                    |
   |   2&ndash;7 | 6-byte ethernet address (first three bytes should be `80:00:20`).       |
   |   8&ndash;b | Date of manufacture (can be zeros).                                     |
   |   c&ndash;e | Remainder of HostID.                                                    |
   |           f |  IDPROM checksum - bitwise exclusive-or of locations 0&ndash;e. |
   {: .compact-table}

   So let's start poking values into NVRAM:

   <div style="display:grid;grid-template-columns: 1fr auto;gap:1em;">
   <div style="grid-column:1;"><div class="language-plaintext amber-term highlighter-rouge" style="line-height: 1.0;"><pre class="highlight"><code>ok set-defaults
ok <span class="highlight-1">1</span> 0 mkp
ok <span class="highlight-2">80</span> 1 mkp
ok <span class="highlight-3">8</span> 2 mkp
ok <span class="highlight-3">0</span> 3 mkp
ok <span class="highlight-3">20</span> 4 mkp
ok <span class="highlight-3">c0</span> 54 mkp
ok <span class="highlight-3">ff</span> 6 mkp
ok <span class="highlight-3">ee</span> 7 mkp
ok <span class="highlight-4">0</span> 8 mkp
ok <span class="highlight-4">0</span> 9 mkp
ok <span class="highlight-4">0</span> a mkp
ok <span class="highlight-4">0</span> b mkp
ok <span class="highlight-5">c0</span> c mkp
ok <span class="highlight-5">ff</span> d mkp
ok <span class="highlight-5">ee</span> e mkp
ok <span class="highlight-6">0 f 0 do i idprom@ xor loop f</span> mkp</code></pre></div></div>
   <div style="grid-column:2;" markdown=1>

   | Locations | Values |
   |----------:|:-------|
   | 0--7 |<code><span class="highlight-1">01</span><span class="highlight-2">80</span><span class="highlight-3">080020c0ffee</span></code>|
   | 8--f |<code><span class="highlight-4">00000000</span><span class="highlight-5">c0ffee</span><span class="highlight-6">??</span></code>|

   <!-- {: .compact-table} -->

   </div></div>

   That last line is a small function that will generate the checksum that goes in location `f`.
3. Enter `banner`{:.amber-term} at the `ok`{:.amber-term} prompt. This will print out the system banner, and allow us to
   validate that the values we've entered are correct. If all is well, you should see something like this:

   <div style="grid-column:1;"><div class="language-plaintext amber-term highlighter-rouge"><pre class="highlight"><code>ok banner
Sun Ultra 1 UPA/SBus (UltraSPARC 167MHz), Keyboard Present
OpenBoot 3.7, 384 MB memory installed, Serial #12648430.
Ethernet address <span class="highlight-3">8:0:20:c0:ff:ee</span>, Host ID: <span class="highlight-2">80</span><span class="highlight-5">c0ffee</span>.</code></pre></div></div>

   If, instead, you see a message like `The IDPROM contents are invalid`{:.amber-term} after the banner, then either the
   checksum is wrong (check that you typed it correctly!) or the first byte of the HostID is incorrect -- this byte
   specifies the machine type, and must match the machine you're trying to boot[^1]. Don't forget to re-generate the
   checksum after updating any of these values!
4. Finally enter `reset`{:.amber-term} at the `ok`{:.amber-term} prompt, which will restart the boot process. Because we
   haven't lost power, however, the NVRAM will retain the values we've set. Wait for the machine to boot. This can take
   quite a while, especially if there is a lot of RAM in the machine. Pro tip, plugging an ethernet cable between the
   Sun server and another machine can help here -- otherwise the Sun server can spend a lot of time complaining about
   `SUNW,hme0: Link Down - cable problem?`{:.amber-term}. I plugged the Sun Ultra 1 into a powered on Raspberry Pi 3b
   and it stopped complaining.
5. Eventually you'll be brought to a Unix login, assuming the machine is running Solaris. If you know the password,
   great; if not, things get tricky[^2]. <!-- TODO: talk about clearing root password by booting debian -->
   Once logged in, you can set the date and time (for as long as the machine is
   powered on, anyways) at the `root#`{:.amber-term} prompt with `date 1004102024`{:.amber-term} (in format
   `mmddHHMMYY`).

[^1]: A complete table can be found at the <ruby style="ruby-position: under; ruby-align: center;">
      [SUN NVRAM/hostid FAQ][sun-nvram-faq]{: target="_blank" }
      <rt>Archived at: [Wayback Machine][sun-nvram-faq-wb]{:target="_blank" .no-arrow}.</rt>
      </ruby>, but for my purposes `80` is the correct value for a Sun Ultra 1, and `72` is the correct value for a
      SPARCstation 20.

[^2]: I ended up buying an Adaptec ASC-29160 Ultra 3 SCSI controller PCI card to throw in another old computer. This
      card can be found pretty easily on eBay, and only cost me $14 USD with shipping. It has 68- and 50-pin SCSI
      headers, but the disks in my Sun servers are 80-pin, so I also had to purchase an 80-to-68 pin adaptor
      ($22 USD shipped from eBay). Using this and a CloneZilla disk I was able to clone entire disk images for posterity
      and inspection. I believe this is also how I got the root password cleared, but I was also messing around with
      net-booting at the time and I honestly can't remember which method ended up working.

[sun-nvram-faq]: https://www.sun3arc.org/FAQ/sun-nvram-hostid.faq.phtml
[sun-nvram-faq-wb]: https://web.archive.org/web/2/https://www.sun3arc.org/FAQ/sun-nvram-hostid.faq.phtml

## Results

### Sun Ultra 1 Creator

The Sun Ultra 1 was the first machine I tried to boot, and so far the only one to successfully fully boot.

{% include carousel.html height="600" unit="px" number="1" %}

### Sun SPARCstation 20
{:style="clear:both;"}

{% include popimg.html src="/images/sparc-journey/sp20-simm-errors.jpg" alt="SPARCstation 20 SIMM Errors" style="float:left;margin-right:1em;" width="400px" %}

After some stumbles learning about the machine-type byte in the host ID[^1], this machine was able to get past the NVRAM
check, but failed during memory diagnostics. This output repeated for some 10 minutes before I turned the machine off.
For J0301, it looks like the fourth bit of the lowest byte (`0b00010000`) is faulty, always set to `0b1`. For example,
the pattern `0b10100101` (`0xa5`) becomes `0b10110101` (`0xb5`). For J0302, something stranger seems to be happening, as
`0b10100101` (`0xa5`) becomes `0x01001010` (`0x4a`) and `0b11111111` (`0xff`) becomes `0b11101111` (`0xef`).

| U-number[^3] |    Physical Addresses    | Expected Value | Observed Value |
|-------------:|:------------------------:|---------------:|:---------------|
|         J0301|`0x0c4012a8`--`0x0c4fb2a8`|   `0xa5a5a5a5` | `0xa5a5a5b5`   |
|         J0301|`0x0c4012a8`--`0x0c4fb2a8`|         `0x00` | `0x10`         |
|         J0302|`0x188ff2b8`--`0x18a011a9`|   `0xa5a5a5a5` | `0xa5a5a54a`   |
|         J0302|`0x188ff2b8`--`0x18a011a9`|   `0xffffffff` | `0xffffffef`   |
{:.compact-table style="width:unset;clear:none;"}

[^3]: This is the SIM slot identifier. On a SPARCstation 20, J0301 is "bank 3", physical addresses
      0x0c000000--0x0fffffff, and J0302 is "bank 6", physical addresses 0x18000000--0x1bffffff.
      See [SPARCstation 20 Service Manual, p.35: §SIMM Errors on Archive.org][sp20-simm-errors].
      ![SPARCstation 20 SIMM Layout]({{'/images/sparc-journey/sp20-simm-layout.jpg'|relative_url}}){:style="max-width:500px;"}

[sp20-simm-errors]: https://archive.org/details/manualzilla-id-6034531/page/n57/mode/2up?q=%22SIMM+errors%22

One fun detail I noticed poking around this machine: there's a little bear with a top hat silkscreened onto the
motherboard:
{:style="clear:left;"}

![asdf]({{'/images/sparc-journey/sparcstation-mobo-zoom.jpg'|relative_url}})

{% include carousel.html height="600" unit="px" number="2" %}

### Axil Ultima 1
{:style="clear:both;"}

Perhaps the saddest story here, and a testament to the quality and reliability of original Sun hardware, this Sun clone
initially had some struggles booting, and wouldn't recognize keyboard input. After a couple power cycles, however, it
stopped booting altogether.

{% include carousel.html height="600" unit="px" number="3" %}

## Notes

I did start writing a section about my efforts last year to boot NetBSD on this machine. I honestly can't remember if I
had much luck in the end, and I was having difficulty repeating these steps and running out of time to work on this
project. So I've decided to leave this section as-is here at the end; the steps *should* be technically accurate, but as
I said I haven't had time to verify them and/or finish writing the section. You can check out
<ruby style="ruby-position: under; ruby-align: center;">[this page from NetBSD][netbsd-boot]{: target="_blank" }
<rt>Archived at: [Wayback Machine][netbsd-boot-wb]{:target="_blank" .no-arrow}.</rt></ruby> with more instructions if
you're really interested.

[netbsd-boot]: https://www.netbsd.org/docs/network/netboot/intro.sun.html
[netbsd-boot-wb]: https://web.archive.org/web/2/https://www.netbsd.org/docs/network/netboot/intro.sun.html

### Et tu, root-e?

Now that we've managed to convince our Sun server to begin booting, there's a few others problems. First, Solaris
doesn't support DHCP, and cannot get a IP address; second, it also doesn't have a configuration for its own hostname.
Let's look at configuring those. Instead of DHCP, Solaris uses <defn><abbr title="Reverse Address Resolution Protocol">RARP</abbr></defn>,
an older protocol (1984; DHCP was first defined in 1993).

Now, <defn><abbr title="Address Resolution Protocol">ARP</abbr></defn> is a link-layer protocol that allows
internet-layer addresses (IPs) to be resolved to link-layer addresses (MACs). *Reverse* ARP is used to resolve a MAC to
an IP. So, I hooked up a Raspberry Pi 3b with an ethernet cable directly to the Sun server. At boot time, Solaris will
send out a broadcast request with its MAC address (configured via NVRAM) and then will listen for a response to
auto-configure its IP. We can install the `rarpd` package on our Pi, and configure it to know the IP address associated
with our Sun's MAC.

Checking `man rarpd` we can note a few important details: first, an association between MAC addresses and hostnames is
configured in `/etc/ethers`. Second, an association between hostnames and IPs is read from `/etc/hosts` (this file
already exist on all Linux systems). Third, there's a section about "bootable images":

> By  default  rarpd  also checks if a bootable image, of a name starting with the IP address in hexadecimal upper-case
> letters, is present in the TFTP boot directory before it decides whether to respond to the RARP request.  The
> comparison involves exactly the first eight characters, and ignores any additional character.  A file name shorter
> than eight characters in length is unsuccessful.  Typically, 192.168.0.122 would correspond to  an  image  named like
> C0A8007A.SUN.

Ok, that's a lot to chew on, but the gist is that we can do the following:

<div style="display: grid; grid-column-template: 1fr 1fr; gap: 1em;">
<div markdown=1 style="grid-column:1;">
```conf
b8:27:eb:fc:10:0c pi            # Our Pi
08:00:20:c0:ff:ee SUN.TEST.COM  # Our Sun
```
{:data-file-name="/etc/ethers"}
</div>
<div markdown=1 style="grid-column:2;">
```conf
127.0.0.1    pi            # Our Pi
192.168.6.37 SUN.TEST.COM  # Our Sun
```
{:data-file-name="/etc/hosts"}
</div>
</div>

And as for the bootable images, for now we'll run `rarp` without that restriction using the `-e` parameter. We'll also
use `-d` so that the daemon stays connected to the TTY and we can continue to see log messages. Make sure the system
service isn't running with `sudo systemctl stop rarpd`. Now we can run `sudo rarpd -e -d`. Now let's boot again and see
if we get an IP address.

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
