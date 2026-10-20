#!/bin/bash
set -euo pipefail

repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
deploy_root="${ARCANE_DEPLOY_ROOT:-/home/arcane/public_html}"
backup_root="${ARCANE_BACKUP_ROOT:-/home/arcane/website-backups}"
deployment_id="$(date -u +%Y%m%dT%H%M%SZ)-$$"

test -f "$repository_root/index.html"
test -f "$repository_root/arcane.css"
mkdir -p -- "$deploy_root" "$backup_root"
chmod 700 "$backup_root"

# Preserve the complete previous website outside the public document root.
backup_file="$backup_root/arcane-before-$deployment_id.tar.gz"
tar -czf "$backup_file" -C "$deploy_root" .
chmod 600 "$backup_file"

# Publish browser assets only; never expose Git metadata, server code or tooling.
while IFS= read -r -d '' source_file; do
  cp -p -- "$source_file" "$deploy_root/"
done < <(find "$repository_root" -maxdepth 1 -type f \( \
  -name '*.html' -o -name '*.css' -o -name '*.js' -o \
  -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o \
  -name '*.webp' -o -name '*.svg' -o -name '*.ico' -o \
  -name '*.mp3' -o -name '*.pdf' -o -name 'robots.txt' -o \
  -name 'sitemap.xml' \) -print0)

for page_directory in assets company approach expertise projects gallery; do
  test -d "$repository_root/$page_directory"
  cp -R -- "$repository_root/$page_directory" "$deploy_root/"
done

# Replace the old WordPress routing after its configuration has been backed up.
cp -p -- "$repository_root/scripts/cpanel.htaccess" "$deploy_root/.htaccess"
printf 'Arcane deployed to %s; previous site saved at %s\n' "$deploy_root" "$backup_file"
