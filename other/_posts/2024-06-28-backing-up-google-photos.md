---
# cSpell:ignore datahoarding truenas chattr distros pigz Coreutils jdupes Bruchon's fdupes mmutable numfmt iles
# cSpell:words hardlink hardlinked hardlinks Photoprism
layout: post
title:  "How I Back Up Google Photos"
subtitle: Using ZFS and Photoprism
tags: [datahoarding, self-hosting, zfs, photoprism, truenas]
author: Sidneys1
toc: true
excerpt_separator: <!--more-->
permalink: /Backing-Up-Google-Photos/
mastodon_comment_url: https://infosec.exchange/@Sidneys1/112696052754347038
---

Google Photos is wonderful. It backs up my photos and videos, tags them, and makes them available to share with my
family.

But I also don't trust that Google will never accidentally "loose" my photos. Here is the process I use to back up my
Google Photos data to a self-hosted instance of Photoprism.

<!--more-->
This guide covers the process I use to back up my Google Photos content, in its original quality and with sidecar
metadata, to Photoprism.

Prerequisites and Setup
-----------------------

My Photoprism instance runs on a TrueNAS Scale server as a kubernetes app. While yours doesn't have to run in the exact
setup, it's worth describing. Photoprism has three primary storage folders, "Originals", "Imports", and a data path for
sidecar files, multimedia caches, and the database file (if you're using the built-in Sqlite storage, though I'd
strongly caution you to set up an external MariaDB instance if you have a large photo library). Photoprism treats
"Originals" as essentially a read-only store of media - anything you put in here will be imported by Photoprism as-is.
Meanwhile any media put in "Imports" will be ingested by Photoprism and moved to the Originals folder; however you will
have no control over the organization of these imported media. For our purposes, I *strongly* recommend putting your
Google Photos media in "Originals" to preserve the folder structure Takeout outputs.

In my TrueNAS setup the Originals and Import folders are mounted onto ZFS datasets on the host, which allows me to
access and administer the media files while Photoprism isn't running. Specifically, "Originals" is mounted to
`/mnt/Bulk Storage/Photoprism/Originals`, which we'll just call `$ORIGINALS` from here on. First and most importantly,
we will be using ZFS extended attribute `i`mmutable to ensure that any files already in our "Originals" folder won't
be overwritten when we extract the Takeout GZip archives. To do this, we can run the following command:

```sh
# Find all regular files in our Originals folder and mark them as +i (immutable).
find "$ORIGINALS" -type f -print0 \
| sudo xargs -0 -n 1 chattr +i
```

We'll also be using a few tools not distributed with TrueNAS Scale (or more Linux distros, for that matter). Most can be
installed via package managers, the rest can be built from source:

- `pigz` - Parallel GZip implementation ([homepage](http://www.zlib.net/pigz/)).
- `progress` - Coreutils' progress viewer (not necessary - just nice; [homepage](https://github.com/Xfennec/progress)).
- `jdupes` - Jody Bruchon's enhanced `fdupes` clone ([homepage](https://codeberg.org/jbruchon/jdupes)).

Step 1 - Create Takeout Archives
--------------------------------

1. Go to [Google Takeout](https://takeout.google.com).
2. Click <button>Deselect all</button>.
3. Scroll down to "Google Photos" and select its checkbox.
4. Scroll to the bottom and click <button>Next Step</button>.
5. For "File type" select `.tgz`, and for "File size" select 50GB.
6. Click <button>Create Export</button>.

Step 2 - Downloading Takeout Archives
-------------------------------------

<div markdown=1>

Once your Google Takeout files are ready you will get an email (you can also check the Takeout site for completed
archives). Depending on the size of our Google Photos library you may have multiple ~50GB files. I usually have around
10-15. I prefer to download one file at a time (depending on free disk space). Clicking the file will start a browser
download, but I like to pause this download, right-click it and "copy download URL", and then enter that into a download
tool like Aria2.

<aside markdown=1>

The total size of your Takeout files may be much larger than your total Google Photos library. Takeout will organize
your photos and videos by year and month, but any named albums you've created will also have a top-level folder
containing yet another copy of any photos or videos in that album.

Because of this, we'll be utilizing some ZFS tricks to minimize and deduplicate your disk usage.

</aside>

</div>

Step 3 - Extracting Takeout Archives
------------------------------------

Once I have some Takeout archive files downloaded (you don't have to download them all at once, or even in order!) we'll
start extracting them into our "Originals" folder. Your Photoprism instance shouldn't index Originals unless you tell it
to, but I usually shut Photoprism down while performing these steps just to be safe.

<details markdown=1><summary>Here's the script I use.</summary>

This will use `pigz` to extract the specified archive in parallel (for speed) and then extract the Google Photos files
into our "Originals" folder:

```sh
#!/usr/bin/env sh

# Usage:
# sudo ./extract-to-originals.sh takeout-archive.tgz

if [ "$(id --user)" -ne 0 ]; then
    echo "Please run with sudo!" 1>&2;
    exit 1;
fi

pigz --decompress <"$1" \
| tar --extract --strip-components=2 --skip-old-files --directory="$ORIGINALS" \
& progress --wait -monitor --command pigz;

chown -R photoprism:photoprism "$ORIGINALS";
```
{:data-file-name="extract-to-originals.sh"}

Let's break down what's happening here:

1. `if [ "$(id -u)" -ne 0];` - checks if the script was run as `root` (or with `sudo`).
2. `pigz --decompress <"$1"` - decompress the GZip file specified in the first passed to the script.
3. `tar --extract`… - extract files from the Tar archive that `pigz` decompressed. There's a few extra options:
   - …`--strip-components=2`…: remove some unnecessary path components that Takeout adds.
   - …`--skip-old-files`…: skip files that already exist on disk.
   - …`--directory`: extract files into our `$ORIGINALS` folder.
4. `progress --wait --monitor --command pigz` - monitor the progress of the `pigz` command in decompressing the input
   file.
5. `chown -R photoprism:photoprism "$ORIGINALS"` - Because `tar` attempts to preserve the ownership of the files it
   extracts, we need to correct this after extraction. Obviously update the `user:group` to suit your own needs.

Because the files already in our "Originals" folder are marked `i`mmutable tar can't overwrite them - and in fact we
also provide tar with the `--skip-old-files` option to avoid a lot of error output about not being able to extract
existing files. We do this so that the next time you want to back up your Google Photos, any files that existed between
the last backup and the new one aren't re-written and we can safely skip extracting them from the archive. This will
save a *ton* of time.

</details>

Step 4 - Deduplicating Media Files
----------------------------------

Repeat step 3 for all of the Takeout archives - you can delete each one as you go once it's been extracted. Once you're
done, we can inspect how many files we have that are new by counting the files that are not `i`mmutable.

<details markdown=1><summary>Here's a little script to do just that.</summary>

```sh
#!/usr/bin/env sh

if [ "$(id -u)" -ne 0 ]; then
    echo "Please run with sudo!" 1>&2;
    exit 1;
fi

find "$ORIGINALS" -type f -print0 \
| xargs --null lsattr \
| grep -- "----------------------" \
| wc --lines;
```
{:data-file-name="count-new-originals.sh"}

Breaking it down:

1. `if [ "$(id -u)" -ne 0 ]` - again, checks that we're running as `root` or with `sudo`.
2. `find "$ORIGINALS" -type f -print0` - finds files in our originals folder. We use `-print0` to safely handle
   filenames with weird characters in them.
3. `xargs --null lsattr` - for each file that `find` outputs we want to run `lsattr` - this will list any extended
   attributes on each file.
4. `grep -- "----------------------"` - for each line (file) of output from `lsattr`, we're only interested in lines
   (files) that have no extended attributes set (files that have `i`mmutable set would show as
   `----i-----------------`).
5. `wc --lines` - count the number of lines (files).

</details>

Neat! Now let's deduplicate all of these files. As mentioned in the aside above, Takeout will include multiple copies
of each piece of media, as each one can appear in multiple albums. To deduplicate this and save you a bunch of hard
drive space we'll use `jdupes`. This tool will search for files that are identical and (in our case) turn them into
filesystem hardlinks - which means that the same data on disk can be pointed to by multiple file names.

First we need to change all files back from immutable. This can be done quickly with `sudo chattr -R -i "$ORIGINALS"`.
Then we run `jdupes`, which has a lot of options, but the ones we want are:

```sh
sudo jdupes --link-hard --recurse "$ORIGINALS"
```

Aka:

- `--link-hard` - we want to hard-link all identical files together.
- `--recurse` - consider all files within subdirectories of `$ORIGINALS` recursively.

When this is done we'll have potentially saved a lot of disk space!

<details markdown=1><summary>Want to find out how much?</summary>

Here's a short command that will tell you exactly how much space has been saved!

```sh
find "$ORIGINALS" -type f -links +1 -printf '%i %s\n' \
| awk 'a[$1]++{sum+=$2}END{print sum}' \
| numfmt --to=iec-i --suffix=B
```
{:data-file-name="deduplication-space-savings.sh"}

Here's the gist of what's happening:
1. `find "$ORIGINALS" -type f`… - find all `f`iles in `$ORIGINALS`;
   - …`-links +1`… - that have more than one hardlink;
   - …`-printf '%i %s\n'` - and output the file's `inode` number and file size (in bytes).
2. `awk 'a[$1]++{sum+=$2}END{print sum}'` - this line is a bit heavy, but here's what the `awk` script is doing:
   - `a[$1]++`

     Increment the value stored in `a[$1]` (where `$1` is going to be the `inode` number from each line). The `inode` is
     the unique data on disk - multiple file paths hardlinked to the same data will have the same `inode` number.
   - `{sum+=$2}`

     The `{sum+=$2}` part is a conditional clause - that means that if the value before it is "truthy" it will execute.
     The first time a unique `inode` is encountered `a[$1]++` will post-increment to 1, returning 0. This is falsy, so
     the conditional clause won't run. Each time an inode is encountered after that, however, the value with be 1 or more,
     which is a truthy value and the conditional clause will run. All the clause actually does (when run) is increment
     the value `sum` (which starts at 0) by `$2` (the file size in bytes).
   - `END{print sum}` - when the script ends, print the value in `sum`.
3. `numfmt --to=iec-i --suffix=B` - this converts the value of `sum` output by `awk` to an IEC size (e.g., `1024` would
   be converted to `1.0KiB`).

So as an example, say our "Originals" folder only contains three files:

- 🖼️ `a.jpg`
- 🖼️ `b.jpeg`
- 📄 `sidecar.json`

And `a.jpg` and `b.jpeg` are both hardlinks to the same 1MiB of data, and `sidecar.json` is a 1KiB standalone file. When
we run our script, the `find` portion will output three lines:

```
12345 1048576
12345 1048576
67890 1024
```

When `awk` gets these lines, it will perform the following:

- Line 1: Post-increment `a[12345]` (from 0 to 1), returning 0. 0 is falsy, so `{sum+=1048576}` doesn't run.
- Line 2: Post-increment `a[12345]` (from 1 to 2), returning 1. 1 is truthy, so `{sum+=1048576}` runs - sum is now `1048576`.
- Line 3: Post-increment `a[67890]` (from 0 to 1), returning 0. 0 is falsy, so `{sum+=1024}` doesn't run.
- End of input: `END{print sum}` runs, outputting `1048576`.

Finally, `numfmt` converts `1048576` to `1.0MiB`, and we see our space savings is 1 megabyte! This is correct, as if
`b.jpeg` wasn't hardlinked to `a.jpg` it would take an additional 1 megabyte.

</details>

Cleanup
-------

Finally, we can re-mark our files as `i`mmutable:

```sh
find "$ORIGINALS" -type f -print0 \
| sudo xargs -0 -n 1 chattr +i
```
{:data-file-name="make-files-immutable.sh"}

Now we turn Photoprism back on, and tell it to re-index new files in the Originals folder. It will even intelligently
use the sidecar JSON files that Takeout exports to enrich each media item with additional metadata.
