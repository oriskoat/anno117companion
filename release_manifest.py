"""Single release contract. No credentials, local captures or settings are distributable."""
from pathlib import Path
from version import APP_VERSION, BUILD_CHANNEL, REPOSITORY

ROOT=Path(__file__).resolve().parent
DASH=Path('android-probe/app/src/main/assets/dashboard')
ANDROID_PACKAGE='hu.anno117.companion'
ANDROID_CERT_SHA256='d8ebc84cc0a6e419cccc0908cf56076c9e56cf318f2156a25c928beb19f34fd6'
FORBIDDEN={'bridge-settings','captures','game-data','.git','.gradle','__pycache__','node_modules','private','build','releases'}
PRIVATE_NAMES={'local.properties','PROJECT_NOTES.md','release-signing.json','devices.json','pairing.json'}

def permitted(path):
    return not (set(path.parts)&FORBIDDEN or path.name in PRIVATE_NAMES or path.suffix.lower() in {'.jks','.keystore','.a8s','.a7s','.pyc','.log'} or path.name.startswith('.env'))

# Add public documentation and release tools here deliberately.
PUBLIC_FILES = frozenset("""
.gitattributes
.github/FUNDING.yml
.github/workflows/checks.yml
.gitignore
.ideas/README.md
.ideas/pannonia-population-needs.en.md
.ideas/pannonia-research-and-skeleton.en.md
.ideas/save-insights.md
.ideas/screenshots/save-insights-overview.png
.ideas/screenshots/save-insights-route.png
.ideas/screenshots/save-insights-stock-history.png
.posters/aegyptus-chain-poster-a4.png
.posters/aegyptus-production-a2.png
.posters/albion-production-a2.png
.posters/latium-production-a2.png
ASSET_RIGHTS.md
CHANGELOG.md
CHANGELOG_ANDROID.md
CHANGELOG_WINDOWS.md
LICENSE
PRIVACY.md
README.de.md
README.md
START_HERE.txt
THIRD_PARTY_NOTICES.md
android-probe/app/build.gradle
android-probe/build.gradle
android-probe/gradle.properties
android-probe/gradlew
android-probe/gradlew.bat
android-probe/reference/NamedPipe.java
android-probe/reference/PipeShare.java
android-probe/reference/SmbConfig.java
android-probe/settings.gradle
audit_windows_bundle.py
bridge.py
build_release.ps1
capture.py
connection_tools.py
desktop_app.py
docs/ARCHITECTURE_CONTRACTS.md
docs/BUILD.md
docs/Example-Empire-Summary.pdf
docs/RELEASE_028.md
docs/RELEASE_NOTES.md
docs/RELEASE_NOTES_028.md
docs/SCREENSHOTS.md
docs/SETUP.de.md
docs/SETUP.md
docs/SIGNING_CERTIFICATE.txt
docs/VERIFICATION.md
docs/WINDOWS_COMPATIBILITY.md
docs/screenshot-manifest.json
docs/screenshots/01-windows-home.jpg
docs/screenshots/02-windows-supply.jpg
docs/screenshots/03-windows-chain.jpg
docs/screenshots/04-windows-needs.jpg
docs/screenshots/05-browser-trade-routes.png
docs/screenshots/06-browser-regional-import.png
docs/screenshots/07-android-supply.png
docs/screenshots/08-android-product.png
docs/screenshots/09-android-widget.png
docs/screenshots/10-pdf-overview.png
docs/screenshots/11-pdf-production-icons.png
docs/screenshots/12-browser-import-sources-desktop.png
docs/screenshots/13-browser-import-sources-mobile.png
docs/screenshots/14-aegyptus-chains.png
docs/screenshots/15-aegyptus-needs.png
docs/screenshots/16-save-insights.png
docs/screenshots/17-candidate-home-desktop.png
docs/screenshots/18-candidate-plan-mobile-browser.png
docs/screenshots/19-candidate-more-mobile-browser.png
docs/screenshots/20-overview-desktop.png
docs/screenshots/21-balanced-chains.png
docs/windows-compatibility-results.json
docs/windows-dependencies-0.20.0.json
docs/windows-dependencies-0.20.1.json
docs/windows-dependencies-0.20.2.json
docs/windows-self-test-0.20.1.json
docs/windows-self-test-0.20.2.json
docs/windows-selftest-0.20.0.json
empire_report.py
guid_map.json
import_content_pack.py
package-lock.json
package.json
prepare_full_release.py
prepare_public_release.py
prepare_release.py
release_manifest.py
requirements-build.txt
save_catalogue.json
startup_guard.py
test_advisor.cjs
test_bridge.py
test_catalogue_chains.cjs
test_chain_model.cjs
test_connection_tools.py
test_empire_overview.py
test_governor.cjs
test_island_planner.cjs
test_needs.cjs
test_procurement.cjs
test_production_context.py
test_province_planner.cjs
test_public.py
test_release.cjs
test_release_028.cjs
test_release_028.py
test_report.py
test_save_insights.cjs
test_save_insights.py
test_save_selection.py
test_startup.py
test_trade_routes.py
test_transport.py
test_updater.py
tools/audit_specialist_catalogue.py
tools/build_advisor_rules.py
tools/build_android_release.ps1
tools/build_capabilities.py
tools/build_demo.py
tools/build_regional_events.py
tools/build_save_catalogue.py
tools/build_source_manifest.py
tools/check_release_browser.cjs
tools/collect_release_copy.cjs
tools/package_release.py
tools/serve_test_dashboard.py
tools/translate_release_copy.py
tools/update_dashboard_art.py
tools/update_production_catalogue.py
tools/update_residence_needs.py
tools/update_specialists.py
trade_routes.py
updater.py
version.py
""".split())
SOURCE_TREES = ('save_reader', 'android-probe/app/src/main', 'android-probe/gradle/wrapper', 'localization', 'third-party')


def source_files(root=ROOT):
    import os
    result = {root / name for name in PUBLIC_FILES if (root / name).is_file()}
    for tree in SOURCE_TREES:
        for directory, dirs, files in os.walk(root / tree):
            dirs[:] = [d for d in dirs if d not in FORBIDDEN]
            result.update(Path(directory) / name for name in files)
    return sorted(p for p in result if permitted(p.relative_to(root)))


def contract():
    return {'version':APP_VERSION,'channel':BUILD_CHANNEL,'repository':REPOSITORY,'android_package':ANDROID_PACKAGE,'android_cert_sha256':ANDROID_CERT_SHA256,'windows_signing':'unsigned (same as previous public release)','published':False}
