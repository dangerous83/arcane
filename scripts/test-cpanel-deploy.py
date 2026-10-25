"""Offline integration checks for cPanel publication and rollback protection."""
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest

SOURCE = Path(__file__).resolve().parent.parent


def run(*args, cwd=None, env=None):
    return subprocess.run(args, cwd=cwd, env=env, text=True, capture_output=True)


class CpanelDeployment(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="arcane-deploy-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.remote = self.root / "remote.git"
        self.writer = self.root / "writer"
        self.checkout = self.root / "checkout"
        self.public = self.root / "public"
        self.backups = self.root / "backups"
        self.state = self.root / "state"
        self.must("git", "init", "--bare", "--initial-branch=main", str(self.remote))
        self.must("git", "init", "--initial-branch=main", str(self.writer))
        self.must("git", "config", "user.name", "Release test", cwd=self.writer)
        self.must("git", "config", "user.email", "release@example.invalid", cwd=self.writer)
        self.must("git", "remote", "add", "origin", str(self.remote), cwd=self.writer)
        for name in [".cpanel.yml", "scripts/deploy-cpanel.sh", "scripts/auto-deploy-cpanel.sh"]:
            self.write(name, (SOURCE / name).read_text())
        self.write("scripts/cpanel.htaccess", "DirectoryIndex index.html\nOptions -Indexes\n")
        self.write("index.html", (SOURCE / "index.html").read_text())
        self.write("gallery/index.html", (SOURCE / "gallery/index.html").read_text())
        self.write("gallery.html", (SOURCE / "gallery.html").read_text())
        self.write("approach.html", (SOURCE / "approach.html").read_text())
        for name in ["arcane.css", "arcane.js", "arcane-video.js", "arcane-gallery.js"]:
            self.write(name, "/* fixture browser asset */\n")
        for directory in ["assets", "company", "approach", "careers", "expertise", "projects"]:
            self.write(directory + "/fixture.txt", "release content\n")
        self.write("expertise/grg/index.html", "Current GRG gallery without the moved ceiling photos\n")
        self.publish("Initial complete release")
        self.must("git", "clone", str(self.remote), str(self.checkout))
        self.public.mkdir()
        (self.public / "index.html").write_text("Previous published website\n")
        self.env = dict(os.environ, ARCANE_DEPLOY_ROOT=str(self.public),
                        ARCANE_BACKUP_ROOT=str(self.backups), ARCANE_AUTO_DEPLOY_STATE=str(self.state))

    def must(self, *args, cwd=None):
        result = run(*args, cwd=cwd)
        self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
        return result.stdout.strip()

    def write(self, name, content):
        target = self.writer / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content)

    def publish(self, message):
        self.must("git", "add", "-A", cwd=self.writer)
        self.must("git", "commit", "-m", message, cwd=self.writer)
        self.must("git", "push", "origin", "main", cwd=self.writer)

    def deploy(self, auto=True):
        name = "auto-deploy-cpanel.sh" if auto else "deploy-cpanel.sh"
        return run("bash", str(self.checkout / "scripts" / name), env=self.env)

    def assertSuccess(self, result):
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def assertPreserved(self, result):
        self.assertNotEqual(result.returncode, 0, result.stdout)
        self.assertEqual((self.public / "index.html").read_text(), "Previous published website\n")
        self.assertFalse(self.backups.exists(), "Failed preflight must not start publishing or backups")

    def test_manual_deploy_task_pulls_latest_and_preserves_backup(self):
        self.assertIn("scripts/auto-deploy-cpanel.sh", (self.checkout / ".cpanel.yml").read_text())
        self.write("index.html", (self.writer / "index.html").read_text() + "<!-- newer release -->\n")
        self.publish("New release after cPanel checkout")
        self.assertSuccess(self.deploy())
        self.assertEqual((self.public / "index.html").read_text(), (self.writer / "index.html").read_text())
        self.assertTrue((self.public / "arcane-video.js").is_file())
        self.assertTrue((self.public / "gallery/index.html").is_file())
        self.assertEqual((self.public / "gallery.html").read_text(), (self.writer / "gallery.html").read_text())
        with tarfile.open(next(self.backups.glob("*.tar.gz"))) as archive:
            self.assertEqual(archive.extractfile("./index.html").read(), b"Previous published website\n")

    def test_auto_sync_restores_missing_gallery_entry(self):
        self.assertSuccess(self.deploy())
        (self.public / "gallery.html").unlink()
        self.assertSuccess(self.deploy())
        self.assertEqual((self.public / "gallery.html").read_text(), (self.writer / "gallery.html").read_text())

    def test_auto_sync_restores_overwritten_cache_configuration(self):
        self.assertSuccess(self.deploy())
        (self.public / ".htaccess").write_text("DirectoryIndex old.html\n")
        self.assertSuccess(self.deploy())
        self.assertEqual((self.public / ".htaccess").read_text(),
                         (self.writer / "scripts/cpanel.htaccess").read_text())

    def test_published_html_does_not_keep_old_checkout_timestamp(self):
        old_time = 1_600_000_000
        os.utime(self.checkout / "index.html", (old_time, old_time))
        os.utime(self.checkout / "gallery/index.html", (old_time, old_time))
        self.assertSuccess(self.deploy())
        self.assertGreater((self.public / "index.html").stat().st_mtime, old_time)
        self.assertGreater((self.public / "gallery/index.html").stat().st_mtime, old_time)

    def test_outdated_direct_deployment_is_rejected_before_writes(self):
        self.write("new.txt", "Later upstream release\n")
        self.publish("Advance upstream")
        result = self.deploy(auto=False)
        self.assertIn("outdated", result.stdout)
        self.assertPreserved(result)

    def test_auto_sync_repairs_public_files_even_when_commit_state_matches(self):
        self.assertSuccess(self.deploy())
        commit = (self.state / "deployed-commit").read_text()
        (self.public / "index.html").write_text("Accidentally deployed old website\n")
        (self.public / "arcane-video.js").unlink()
        self.assertSuccess(self.deploy())
        self.assertEqual((self.state / "deployed-commit").read_text(), commit)
        self.assertEqual((self.public / "index.html").read_text(), (self.writer / "index.html").read_text())
        self.assertTrue((self.public / "arcane-video.js").is_file())

    def test_auto_sync_repairs_an_overwritten_inner_page(self):
        self.assertSuccess(self.deploy())
        target = self.public / "expertise/grg/index.html"
        target.write_text("Old GRG gallery with ceiling photos\n")
        self.assertSuccess(self.deploy())
        self.assertEqual(target.read_text(), (self.writer / "expertise/grg/index.html").read_text())

    def test_missing_video_bundle_cannot_replace_published_site(self):
        (self.writer / "arcane-video.js").unlink()
        self.publish("Incomplete release")
        result = self.deploy()
        self.assertIn("arcane-video.js", result.stdout)
        self.assertPreserved(result)

    def test_missing_dropdown_video_is_rejected(self):
        content = (self.writer / "index.html").read_text().replace('data-video-menu="projects-menu"', "")
        self.write("index.html", content)
        self.publish("Incomplete menu")
        result = self.deploy()
        self.assertIn("missing a required video preview", result.stdout)
        self.assertPreserved(result)

    def test_local_edits_are_preserved(self):
        (self.checkout / "index.html").write_text("Local work to preserve\n")
        self.assertPreserved(self.deploy(auto=False))
        self.assertEqual((self.checkout / "index.html").read_text(), "Local work to preserve\n")

    def test_unavailable_remote_does_not_publish_an_unverified_checkout(self):
        self.must("git", "remote", "set-url", "origin", str(self.root / "unavailable.git"), cwd=self.checkout)
        result = self.deploy(auto=False)
        self.assertIn("Could not verify GitHub main", result.stdout)
        self.assertPreserved(result)

    def test_unchanged_complete_release_is_not_redeployed(self):
        self.assertSuccess(self.deploy())
        count = len(list(self.backups.glob("*.tar.gz")))
        self.assertSuccess(self.deploy())
        self.assertEqual(len(list(self.backups.glob("*.tar.gz"))), count)


if __name__ == "__main__":
    unittest.main(verbosity=2)
