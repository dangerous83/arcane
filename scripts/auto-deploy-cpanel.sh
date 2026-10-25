#!/bin/bash
# Run from cPanel Cron Jobs. No password or GitHub token belongs in this file.
set -euo pipefail
umask 077

main() {
  local repository_root state_root git_bin current_commit deployed_commit deploy_root release_file published_matches
  repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
  state_root="${ARCANE_AUTO_DEPLOY_STATE:-/home/arcane/.arcane-auto-deploy}"
  deploy_root="${ARCANE_DEPLOY_ROOT:-/home/arcane/public_html}"
  mkdir -p -- "$state_root"
  chmod 700 "$state_root"
  command -v flock >/dev/null || { echo "ERROR: flock is required; ask your host to enable it."; return 1; }
  exec 9>"$state_root/lock"
  flock -n 9 || return 0

  if [[ -x /usr/local/cpanel/3rdparty/bin/git ]]; then
    git_bin=/usr/local/cpanel/3rdparty/bin/git
  else
    git_bin="$(command -v git)" || { echo "ERROR: Git is unavailable."; return 1; }
  fi
  export GIT_TERMINAL_PROMPT=0
  cd -- "$repository_root"
  [[ "$("$git_bin" symbolic-ref --short HEAD)" == main ]] || { echo "ERROR: Expected the main branch."; return 1; }
  [[ -z "$("$git_bin" status --porcelain)" ]] || { echo "ERROR: Local repository edits found; deployment stopped to protect them."; return 1; }

  "$git_bin" fetch --quiet origin main
  "$git_bin" merge --quiet --ff-only origin/main
  current_commit="$("$git_bin" rev-parse HEAD)"
  deployed_commit="$(cat "$state_root/deployed-commit" 2>/dev/null || true)"
  # A manual deployment can overwrite public files without changing this state.
  # Compare the actual release too, so the next sync repairs that older copy.
  published_matches=true
  if ! cmp -s -- "$repository_root/scripts/cpanel.htaccess" "$deploy_root/.htaccess"; then
    published_matches=false
  fi
  for release_file in index.html arcane.css arcane.js arcane-video.js arcane-gallery.js approach.html gallery.html gallery/index.html; do
    if ! cmp -s -- "$repository_root/$release_file" "$deploy_root/$release_file"; then
      published_matches=false
      break
    fi
  done
  if [[ "$published_matches" == true ]]; then
    while IFS= read -r -d '' release_file; do
      if ! cmp -s -- "$release_file" "$deploy_root/${release_file#"$repository_root/"}"; then
        published_matches=false
        break
      fi
    done < <(find "$repository_root/company" "$repository_root/approach" "$repository_root/careers" "$repository_root/expertise" "$repository_root/projects" "$repository_root/gallery" -type f -name '*.html' -print0)
  fi
  if [[ "$current_commit" == "$deployed_commit" && "$published_matches" == true ]]; then
    return 0
  fi

  printf '[%s] Deploying %s\n' "$(date -u +%FT%TZ)" "$current_commit"
  (umask 022; /bin/bash "$repository_root/scripts/deploy-cpanel.sh")
  printf '%s\n' "$current_commit" > "$state_root/deployed-commit.tmp"
  mv -- "$state_root/deployed-commit.tmp" "$state_root/deployed-commit"
  printf '[%s] Deployment complete\n' "$(date -u +%FT%TZ)"
}
main "$@"

