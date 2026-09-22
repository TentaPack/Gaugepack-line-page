# A private line: the page, published

The page that line.gaugepack.com serves, every version of it, with its
fingerprints. This is the public half of the trojan-page defence for
[A private line](https://line.gaugepack.com), a Gaugepack product of
TentaPack LLC. The mailbox's code is not here and is not public; only the
page, which every browser can read anyway.

- `hashes.json`: every release, appended, never rewritten: a version (a
  digest over the files), a date, and for each file its SHA-256 and size.
- `HASHES.txt`: the same, one line per file, append-only, easy to diff.
- `page/`: the files themselves at the latest release.
- `allowed_signers`: the public half of the key that signs every release
  tag. Verify a tag with
  `git -c gpg.ssh.allowedSignersFile=allowed_signers verify-tag v<version>`.

How it is used: the page's `/code` fetches `hashes.json` from this
repository (from github.com, not from line.gaugepack.com) and compares it
with the files the browser received; the page's service worker pins the
version it verified and takes an update only when every new file's
fingerprint is on this list, refusing it otherwise and keeping the old
version. The rule this makes true: we can be forced to publish bad code,
but we cannot give one person different code without it being detectable,
because a page that is not on this list fails the check on that phone.

To check by hand: fetch a file from line.gaugepack.com, hash it
(`shasum -a 256`), and look for that hash in `HASHES.txt`. Every hash
that has ever been served should be here; a hash that is not here is a
page nobody was meant to have. Tell support@gaugepack.com.

This list only grows. A release is never removed or edited; a mistaken
release is followed by a corrected one.
