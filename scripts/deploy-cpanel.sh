#!/bin/bash
set -euo pipefail

repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
deploy_root="${ARCANE_DEPLOY_ROOT:-/home/arcane/public_html}"
backup_root="${ARCANE_BACKUP_ROOT:-/home/arcane/website-backups}"
deployment_id="$(date -u +%Y%m%dT%H%M%SZ)-$$"

# Validate the complete release before touching the published website.
if [[ -x /usr/local/cpanel/3rdparty/bin/git ]]; then
  git_bin=/usr/local/cpanel/3rdparty/bin/git
else
  git_bin="$(command -v git)"
fi
export GIT_TERMINAL_PROMPT=0
[[ "$("$git_bin" -C "$repository_root" symbolic-ref --short HEAD)" == main ]] || {
  echo "ERROR: Deployment requires the main branch."; exit 1;
}
[[ -z "$("$git_bin" -C "$repository_root" status --porcelain --untracked-files=no)" ]] || {
  echo "ERROR: Local repository edits found; published files were not changed."; exit 1;
}
current_commit="$("$git_bin" -C "$repository_root" rev-parse HEAD)"
remote_line="$("$git_bin" -C "$repository_root" ls-remote --exit-code origin refs/heads/main)" || {
  echo "ERROR: Could not verify GitHub main; published files were not changed."; exit 1;
}
read -r remote_commit remote_ref <<< "$remote_line"
[[ "$remote_ref" == refs/heads/main && "$remote_commit" == "$current_commit" ]] || {
  echo "ERROR: This checkout is outdated. Run Update from Remote before deploying. Published files were not changed."; exit 1;
}
for required_file in index.html arcane.css arcane.js arcane-video.js arcane-gallery.js gallery/index.html scripts/cpanel.htaccess; do
  [[ -s "$repository_root/$required_file" ]] || {
    printf 'ERROR: Required release file is missing: %s. Published files were not changed.\n' "$required_file"; exit 1;
  }
done
for page_directory in assets company approach careers expertise projects gallery; do
  [[ -d "$repository_root/$page_directory" ]] || {
    printf 'ERROR: Required release directory is missing: %s. Published files were not changed.\n' "$page_directory"; exit 1;
  }
done
for required_markup in 'data-video-menu="expertise-menu"' 'data-video-menu="projects-menu"' 'id="expertise-video-dialog"'; do
  grep -Fq -- "$required_markup" "$repository_root/index.html" || {
    echo "ERROR: The release is missing a required video preview. Published files were not changed."; exit 1;
  }
done

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

for page_directory in assets company approach careers expertise projects gallery; do
  test -d "$repository_root/$page_directory"
  cp -R -- "$repository_root/$page_directory" "$deploy_root/"
done

# Replace the old WordPress routing after its configuration has been backed up.
cp -p -- "$repository_root/scripts/cpanel.htaccess" "$deploy_root/.htaccess"
printf 'Arcane deployed to %s; previous site saved at %s\n' "$deploy_root" "$backup_file"

