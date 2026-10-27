# Dependency compatibility patches

The workspace overrides vulnerable transitive packages rather than suppressing audit findings. `query-string@7.1.3` needs a default-export adapter for patched ESM `decode-uri-component@0.5`. `metro@0.83.3` needs to pass image bytes to patched `image-size@2`, whose synchronous API no longer accepts a file path. Metro 0.83.8 already has its own adapter.

These small pnpm patches are installed from the lockfile. Verify iOS/Android bundle exports and runtime navigation when updating Expo/Metro, and remove a patch when the dependency no longer needs it. The audit covers known npm advisories, not every vulnerability or native FFmpeg/system binary. Keep container images and native codecs patched independently.
