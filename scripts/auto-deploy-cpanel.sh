#!/bin/bash
# Run from cPanel Cron Jobs. No password or GitHub token belongs in this file.
set -euo pipefail
umask 077

main() {
  local repository_root state_root git_bin current_commit deployed_commit
  repository_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
  state_root="${ARCANE_AUTO_DEPLOY_STATE:-/home/arcane/.arcane-auto-deploy}"
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
  [[ "$current_commit" != "$deployed_commit" ]] || return 0

  printf '[%s] Deploying %s\n' "$(date -u +%FT%TZ)" "$current_commit"
  (umask 022; /bin/bash "$repository_root/scripts/deploy-cpanel.sh")
  printf '%s\n' "$current_commit" > "$state_root/deployed-commit.tmp"
  mv -- "$state_root/deployed-commit.tmp" "$state_root/deployed-commit"
  printf '[%s] Deployment complete\n' "$(date -u +%FT%TZ)"
}
main "$@"
