# Security policy

mPile seals each participant's responses in their browser, so the hosted site at mpile.app stores only data it cannot read, and deletes it when a session is closed or expires. A flaw that exposes responses, keys or passcodes, or lets someone read or alter another person's session, is a security problem. The sealing and relay come from the shared packages in [MalverdeSoftware/malverdesoftware](https://github.com/MalverdeSoftware/malverdesoftware/security); report problems in those packages there.

## Supported versions

The current release and the live site at mpile.app. mPile is an early release (0.x); fixes are not backported.

## Reporting a vulnerability

Please don't open a public issue for a security problem. Report it privately through GitHub: on this repository's **Security** tab, choose **Report a vulnerability**. Include what you found, how to reproduce it, and what it could expose.

You'll get an acknowledgment within 7 days. Fixes for confirmed problems ship in a new release, and the advisory is published once a fix is available, with credit to the reporter unless you'd rather not be named.

Never include real participant data, session key files, management keys or passcodes in a report. Use synthetic sessions.
