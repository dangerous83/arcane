# Arcane live updates on CWP

The website server is 136.243.106.42. Use its CWP account; mail.arcane.ae's
cPanel account is a different server and cannot publish this website.

One-time activation:

1. Upload `arcane-auto-update.php` to `/home/arcane/`, outside `public_html`.
2. In CWP Settings > Crontab, create a job every five minutes (`*/5 * * * *`):

   `/usr/local/bin/php /home/arcane/arcane-auto-update.php >> /home/arcane/arcane-live-sync.log 2>&1`

   Use the PHP CLI path supplied by CWP if it differs. PHP 5.6 or newer with
   cURL and working CA certificates is required; TLS verification stays enabled.
3. Run the job with CWP's Run action. View `arcane-live-sync.log` in the home
   folder. Activation is verified only after it reports `Up to date:` or
   `Published` with the current GitHub main commit. Confirm a subsequent small
   website change reaches the live site after the next scheduled execution.

Future changes must be committed and pushed to `dangerous83/arcane` main.
Regenerate the public HTML using `node scripts/build-pages.cjs` after template
or content edits. Uncommitted chat/local edits are not live updates.

The job downloads static website files only. It never executes GitHub code,
copies server-side PHP or tooling into the public directory, or changes DNS,
mail, account credentials, or hosting settings. The repository must remain
public for this token-free setup. GitHub errors stop publication.

Already matching files are reused; no Git checkout or full release ZIP is
stored. Checksums are validated before publication. Changes are staged first,
then their previous bytes are backed up privately, resources are published
before HTML, and a journal supports rollback after a failure or interrupted
run. Only previously managed files are removed when retired from GitHub.
Unknown existing hosting files are preserved. Symbolic links are rejected.
Private sync state and one generation of changed-file backups reside in
`/home/arcane/.arcane-live-sync`. Ensure space for changed files and backups.
The job retains its installed version until explicitly updated.

Disable the scheduled job in CWP to pause automatic publication. Use the same
GitHub main branch as the sole source of website changes once activated;
manual edits to managed website files are replaced by the next sync.
